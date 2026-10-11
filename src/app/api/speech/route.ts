import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';
import { getNarrationForRule } from '@/lib/voice/narration';
import { globalAudioCache } from '@/lib/voice/audio-cache';
import { ElevenLabsService } from '@/lib/voice/elevenlabs';
import { checkRateLimit } from '@/lib/http/rate-limit';
import { generateRequestId } from '@/lib/http/request-id';
import { createErrorResponse } from '@/lib/http/errors';

export const dynamic = 'force-dynamic';

let cachedElevenLabsService: ElevenLabsService | null = null;

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const env = getEnv();

  // 1. Rate limiting check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = checkRateLimit(ip, 'speech', env.RATE_LIMIT_PER_MIN);
  if (!rateLimit.allowed) {
    const res = createErrorResponse(
      'RATE_LIMITED',
      `Rate limit exceeded. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
      'Slow down voice request frequency.',
      requestId
    );
    res.headers.set('Retry-After', String(rateLimit.resetInSeconds));
    return res;
  }

  // 2. Parse and validate JSON payload strictly
  let body: any;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse(
      'BAD_REQUEST',
      'Malformed JSON payload in request.',
      'Send a JSON body with { ruleId, rulesetVersion }.',
      requestId
    );
  }

  if (
    !body ||
    typeof body !== 'object' ||
    typeof body.ruleId !== 'string' ||
    typeof body.rulesetVersion !== 'string' ||
    !body.ruleId.trim() ||
    !body.rulesetVersion.trim()
  ) {
    return createErrorResponse(
      'BAD_REQUEST',
      'Missing or invalid "ruleId" or "rulesetVersion".',
      'Voice generation requires a valid ruleId and rulesetVersion matching the ruleset.',
      requestId
    );
  }

  // 3. Resolve narration strictly from authoritative ruleset
  const ruleNarration = getNarrationForRule(body.ruleId, body.rulesetVersion);
  if (!ruleNarration) {
    return createErrorResponse(
      'RULE_NOT_FOUND',
      `No municipal rule found matching ruleId: "${body.ruleId}" for version: "${body.rulesetVersion}".`,
      'Verify the rule ID exists in the active municipal ruleset.',
      requestId
    );
  }

  // 4. Compute cache key and check disk cache
  const voiceId = env.ELEVENLABS_VOICE_ID;
  const modelId = env.ELEVENLABS_MODEL_ID;
  const cacheKey = globalAudioCache.computeKey(
    ruleNarration.narration,
    voiceId,
    modelId,
    ruleNarration.rulesetVersion
  );

  const cachedBuffer = globalAudioCache.get(cacheKey);
  if (cachedBuffer) {
    return new NextResponse(new Uint8Array(cachedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-Audio-Source': 'cache',
        'Cache-Control': 'public, max-age=86400',
        'X-Request-Id': requestId,
      },
    });
  }

  // 5. Test failure injection
  if (env.FORCE_FAILURE === 'elevenlabs' || env.FORCE_FAILURE === 'both') {
    return createErrorResponse(
      'VOICE_UNAVAILABLE',
      'Spoken audio is currently unavailable (simulated test failure).',
      'Fallback to browser voice synthesis.',
      requestId
    );
  }

  // 6. Check if ElevenLabs key is configured
  if (!env.ELEVENLABS_API_KEY) {
    return createErrorResponse(
      'VOICE_UNAVAILABLE',
      'ElevenLabs API key is not configured. Browser voice is available.',
      'Use browser speech synthesis fallback.',
      requestId
    );
  }

  // 7. Generate speech via ElevenLabs
  try {
    if (!cachedElevenLabsService) {
      cachedElevenLabsService = new ElevenLabsService(env.ELEVENLABS_API_KEY, voiceId, modelId);
    }

    const audioBuffer = await cachedElevenLabsService.generateSpeech({
      text: ruleNarration.narration,
      voiceId,
      modelId,
    });

    // Save to disk cache
    globalAudioCache.set(cacheKey, audioBuffer);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-Audio-Source': 'elevenlabs',
        'Cache-Control': 'public, max-age=86400',
        'X-Request-Id': requestId,
      },
    });
  } catch (err: any) {
    return createErrorResponse(
      'VOICE_UNAVAILABLE',
      err.message || 'ElevenLabs audio generation failed.',
      'Fallback to browser speech synthesis.',
      requestId
    );
  }
}
