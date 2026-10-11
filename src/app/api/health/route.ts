import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';

import { getClassifierProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getEnv();

  const provider = getClassifierProvider();
  const geminiProvider = provider.name === 'gemini' ? 'live' : 'demo';
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
