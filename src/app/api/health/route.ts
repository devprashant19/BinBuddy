import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getEnv();

  const geminiProvider = env.PROVIDER_MODE !== 'mock' && env.GEMINI_API_KEY ? 'live' : 'demo';
  const elevenlabsProvider = env.ELEVENLABS_API_KEY ? 'live' : 'unconfigured';

  return NextResponse.json({
    ok: true,
    version: '1.0.0',
    rulesetId: env.RULESET_ID,
    rulesetVersion: '1.0.0',
    draft: false,
    providers: {
      gemini: geminiProvider,
      elevenlabs: elevenlabsProvider,
    },
    time: new Date().toISOString(),
  });
}
