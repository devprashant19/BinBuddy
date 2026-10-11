import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';
import { loadRuleset } from '@/lib/rules/load';
import { decide } from '@/lib/rules/gating';
import { checkRateLimit } from '@/lib/http/rate-limit';
import { generateRequestId } from '@/lib/http/request-id';
import { createErrorResponse } from '@/lib/http/errors';
import { classificationSchema } from '@/lib/schemas/classification';
import { answersSchema } from '@/lib/schemas/result';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const env = getEnv();

  // 1. Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = checkRateLimit(ip, 'decide', env.RATE_LIMIT_PER_MIN);
  if (!rateLimit.allowed) {
    const res = createErrorResponse(
      'RATE_LIMITED',
      `Rate limit exceeded. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
      'Slow down request frequency.',
      requestId
    );
    res.headers.set('Retry-After', String(rateLimit.resetInSeconds));
    return res;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse(
      'BAD_REQUEST',
      'Malformed JSON payload.',
      'Ensure the request body contains valid JSON.',
      requestId
    );
  }

  if (!body || typeof body !== 'object' || !body.classification) {
    return createErrorResponse(
      'BAD_REQUEST',
      'Missing required property "classification".',
      'Provide a valid classification object.',
      requestId
    );
  }

  const validClassification = classificationSchema.safeParse(body.classification);
  if (!validClassification.success) {
    return createErrorResponse(
      'BAD_REQUEST',
      'Invalid classification data provided.',
      'Classification must conform to the classification schema.',
      requestId
    );
  }

  const validAnswers = answersSchema.safeParse(body.answers || {});
  if (!validAnswers.success) {
    return createErrorResponse(
      'BAD_REQUEST',
      'Invalid answers format provided.',
      'Answers must conform to the answers schema.',
      requestId
    );
  }

  const ruleset = loadRuleset(env.RULESET_ID);
  const result = decide(
    validClassification.data,
    body.answers || {},
    ruleset,
    env.CONFIDENCE_THRESHOLD
  );

  return NextResponse.json({
    requestId,
    source: body.source || 'manual',
    classification: validClassification.data,
    result,
  });
}
