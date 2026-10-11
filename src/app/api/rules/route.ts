import { NextResponse } from 'next/server';
import { loadRuleset } from '@/lib/rules/load';
import { getEnv } from '@/lib/config/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getEnv();
  const ruleset = loadRuleset(env.RULESET_ID);

  return NextResponse.json({
    rulesetId: ruleset.rulesetId,
    version: ruleset.rulesetVersion,
    city: ruleset.city,
    sourceUrl: ruleset.source.url,
    lastVerifiedAt: ruleset.source.lastVerifiedAt,
    draft: ruleset.draft,
    destinations: ruleset.destinations.map((d) => ({
      id: d.id,
      label: d.label,
      tone: d.tone,
      description: d.description,
    })),
  });
}
