import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';
import { loadRuleset } from '@/lib/rules/load';
import { decide } from '@/lib/rules/gating';
import { getClassifierProvider } from '@/lib/providers';
import { mockProvider } from '@/lib/providers/mock';
import { validateImageBuffer } from '@/lib/http/image-validate';
import { checkRateLimit } from '@/lib/http/rate-limit';
import { generateRequestId } from '@/lib/http/request-id';
import { createErrorResponse } from '@/lib/http/errors';
import { classificationSchema, Classification } from '@/lib/schemas/classification';
import { ClassificationLRUCache, globalClassificationCache } from '@/lib/cache/lru';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const env = getEnv();

  // 1. Rate limiting check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = checkRateLimit(ip, 'classify', env.RATE_LIMIT_PER_MIN);
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

  const contentType = req.headers.get('content-type') || '';

  let classification: Classification | null = null;
  let source: 'demo-sample' | 'live' | 'cache' = 'demo-sample';

  // 2. Handle JSON request ({ fixtureId })
  if (contentType.includes('application/json')) {
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

    if (
      !body ||
      typeof body !== 'object' ||
      !body.fixtureId ||
      typeof body.fixtureId !== 'string'
    ) {
      return createErrorResponse(
        'BAD_REQUEST',
        'Missing required field "fixtureId".',
        'Provide a valid fixtureId from /api/fixtures.',
        requestId
      );
    }

    const fixtureClassification = mockProvider.getByFixtureId(body.fixtureId);
    if (!fixtureClassification) {
      return createErrorResponse(
        'BAD_REQUEST',
        `Unknown fixtureId: "${body.fixtureId}".`,
        'Check /api/fixtures for supported demo sample IDs.',
        requestId
      );
    }

    classification = fixtureClassification;
    source = 'demo-sample';
  }

  // 3. Handle multipart/form-data request (image upload)
  else if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return createErrorResponse(
        'BAD_REQUEST',
        'Failed to parse multipart form data.',
        'Submit a valid multipart/form-data request with an "image" field.',
        requestId
      );
    }

    const file = formData.get('image');
    if (!file || !(file instanceof Blob)) {
      return createErrorResponse(
        'BAD_REQUEST',
        'Missing "image" file field in form data.',
        'Attach a photo under the key "image".',
        requestId
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes and size in-memory
    const validation = validateImageBuffer(buffer, file.type, env.MAX_UPLOAD_MB);
    if (!validation.valid) {
      return createErrorResponse(
        validation.errorCode || 'INVALID_IMAGE',
        validation.message || 'Image validation failed.',
        validation.hint || 'Upload a valid JPEG, PNG, or WebP photo.',
        requestId
      );
    }

    // Call classifier provider with LRU cache
    try {
      const provider = getClassifierProvider();
      const cacheKey = ClassificationLRUCache.computeKey(buffer, provider.classifierVersion);
      const cached = globalClassificationCache.get(cacheKey);

      if (cached) {
        classification = cached;
        source = 'cache';
      } else {
        classification = await provider.classify({
          bytes: buffer,
          mime: validation.mime!,
        });
        globalClassificationCache.set(cacheKey, classification);
        source = provider.name === 'gemini' ? 'live' : 'demo-sample';
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (
        errMsg.toLowerCase().includes('daily limit') ||
        errMsg.toLowerCase().includes('per-day') ||
        errMsg.toLowerCase().includes('perday')
      ) {
        return createErrorResponse(
          'CLASSIFIER_UNAVAILABLE',
          'The photo analyzer has hit its daily limit.',
          'Try a sample or pick the item yourself.',
          requestId
        );
      }
      if (errMsg.includes('CLASSIFIER_UNAVAILABLE')) {
        return createErrorResponse(
          'CLASSIFIER_UNAVAILABLE',
          'Vision classifier is currently unavailable.',
          'Try again, use a sample, or pick the item manually.',
          requestId
        );
      }
      return createErrorResponse(
        'CLASSIFIER_BAD_OUTPUT',
        'Classifier failed to analyze the image.',
        'Ensure the item is well-lit and in focus, or try a demo sample.',
        requestId
      );
    }
  } else {
    return createErrorResponse(
      'UNSUPPORTED_TYPE',
      `Unsupported Content-Type: "${contentType}". Please use JPEG, PNG or WebP.`,
      'Please use JPEG, PNG or WebP via multipart/form-data, or send { fixtureId } as application/json.',
      requestId
    );
  }

  // 4. Validate classification output against schema
  const validatedClassification = classificationSchema.safeParse(classification);
  if (!validatedClassification.success) {
    return createErrorResponse(
      'CLASSIFIER_BAD_OUTPUT',
      'Classification output failed internal schema validation.',
      'Try another image or use manual selection.',
      requestId
    );
  }

  // 5. Evaluate deterministic municipal rules
  const ruleset = loadRuleset(env.RULESET_ID);
  const result = decide(validatedClassification.data, {}, ruleset, env.CONFIDENCE_THRESHOLD);

  return NextResponse.json({
    requestId,
    source,
    classification: validatedClassification.data,
    result,
  });
}
