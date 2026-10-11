import { loadRuleset } from '../rules/load';
import { getEnv } from '../config/env';

export interface RuleNarration {
  ruleId: string;
  narration: string;
  destinationId: string;
  rulesetVersion: string;
}

/**
 * Server-only helper: derives narration strictly from authoritative ruleset.
 * Arbitrary client-submitted text is NEVER accepted.
 */
export function getNarrationForRule(
  ruleId: string,
  rulesetVersion: string
): RuleNarration | null {
  if (!ruleId || !rulesetVersion) {
    return null;
  }

  const env = getEnv();
  const ruleset = loadRuleset(env.RULESET_ID);

  if (ruleset.rulesetVersion !== rulesetVersion) {
    return null;
  }

  const rule = ruleset.rules.find((r) => r.id === ruleId);
  if (!rule || !rule.decision || !rule.decision.narration) {
    return null;
  }

  return {
    ruleId: rule.id,
    narration: rule.decision.narration,
    destinationId: rule.decision.destinationId,
    rulesetVersion: ruleset.rulesetVersion,
  };
}
