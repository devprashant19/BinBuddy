import fs from 'fs';
import path from 'path';
import { rulesetSchema, Ruleset } from '../schemas/ruleset';

let cachedRuleset: Ruleset | null = null;

/**
 * Loads, validates, and caches the active city ruleset.
 * Fails loudly on any schema violation or orphaned destination.
 */
export function loadRuleset(rulesetId = 'houston-tx-curbside'): Ruleset {
  if (cachedRuleset && cachedRuleset.rulesetId === rulesetId) {
    return cachedRuleset;
  }

  const filePath = path.resolve(process.cwd(), `data/rules/${rulesetId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Ruleset file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ruleset JSON at ${filePath}: ${(err as Error).message}`);
  }

  const validation = rulesetSchema.safeParse(parsedJson);
  if (!validation.success) {
    const errorDetails = JSON.stringify(validation.error.format(), null, 2);
    throw new Error(`Ruleset validation failed for ${rulesetId}:\n${errorDetails}`);
  }

  const ruleset = validation.data;

  // Verify that all destination IDs referenced by rules exist in destinations list
  const validDestinationIds = new Set(ruleset.destinations.map((d) => d.id));
  for (const rule of ruleset.rules) {
    if (!validDestinationIds.has(rule.decision.destinationId)) {
      throw new Error(
        `Rule "${rule.id}" points to unknown destination "${rule.decision.destinationId}"`
      );
    }
  }

  if (!validDestinationIds.has(ruleset.fallback.destinationId)) {
    throw new Error(`Fallback points to unknown destination "${ruleset.fallback.destinationId}"`);
  }

  cachedRuleset = ruleset;
  return ruleset;
}
