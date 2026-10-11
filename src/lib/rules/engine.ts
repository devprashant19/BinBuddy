import { Classification } from '../schemas/classification';
import { Ruleset, Rule } from '../schemas/ruleset';
import { Decision } from '../schemas/result';

/**
 * Sort rules by descending priority, breaking ties deterministically by rule ID.
 */
export function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Pure evaluation function.
 * Evaluates a classification against a ruleset.
 * Invariants:
 * - Unknown values NEVER satisfy a rule that specifies that field.
 * - Highest priority wins; ties broken alphabetically by rule ID.
 * - Same input always yields same output.
 */
export function evaluate(classification: Classification, ruleset: Ruleset): Decision {
  const sortedRules = sortRules(ruleset.rules);

  for (const rule of sortedRules) {
    const matchedReasons: string[] = [];
    let isMatch = true;

    // Check materials
    if (rule.match.materials && rule.match.materials.length > 0) {
      if (
        classification.material === 'unknown' ||
        !rule.match.materials.includes(classification.material)
      ) {
        isMatch = false;
      } else {
        matchedReasons.push(`Material is ${classification.material}`);
      }
    }

    // Check itemTypes
    if (isMatch && rule.match.itemTypes && rule.match.itemTypes.length > 0) {
      if (
        classification.itemType === 'unknown' ||
        !rule.match.itemTypes.includes(classification.itemType)
      ) {
        isMatch = false;
      } else {
        matchedReasons.push(`Item type is ${classification.itemType}`);
      }
    }

    // Check conditions
    if (isMatch && rule.match.conditions && rule.match.conditions.length > 0) {
      if (
        classification.condition === 'unknown' ||
        !rule.match.conditions.includes(classification.condition)
      ) {
        isMatch = false;
      } else {
        matchedReasons.push(`Condition is ${classification.condition}`);
      }
    }

    // Check resinCodes
    if (isMatch && rule.match.resinCodes && rule.match.resinCodes.length > 0) {
      if (
        classification.visibleResinCode === 'not_visible' ||
        classification.visibleResinCode === 'not_applicable' ||
        !rule.match.resinCodes.includes(classification.visibleResinCode)
      ) {
        isMatch = false;
      } else {
        matchedReasons.push(`Resin code is #${classification.visibleResinCode}`);
      }
    }

    if (isMatch) {
      return {
        ruleId: rule.id,
        decisionType: rule.decision.type,
        destinationId: rule.decision.destinationId,
        reason: rule.decision.reason,
        sourceUrl: rule.sourceUrl,
        matchedBecause: matchedReasons,
      };
    }
  }

  // Fallback decision
  return {
    ruleId: 'fallback',
    decisionType: ruleset.fallback.type,
    destinationId: ruleset.fallback.destinationId,
    reason: ruleset.fallback.reason,
    sourceUrl: ruleset.source.url,
    matchedBecause: ['No verified rule matched the observed attributes'],
  };
}
