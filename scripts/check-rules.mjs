import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const rulesDir = path.resolve(process.cwd(), 'data/rules');

console.log('[check-rules] Checking municipal rulesets in:', rulesDir);

if (!fs.existsSync(rulesDir)) {
  console.error('[check-rules] ERROR: data/rules directory missing!');
  process.exit(1);
}

const ruleFiles = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.json'));

if (ruleFiles.length === 0) {
  console.error('[check-rules] ERROR: No ruleset JSON files found!');
  process.exit(1);
}

let hasError = false;

for (const file of ruleFiles) {
  const fullPath = path.join(rulesDir, file);
  console.log(`[check-rules] Validating ${file}...`);

  let ruleset;
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    ruleset = JSON.parse(raw);
  } catch (err) {
    console.error(`[check-rules] ERROR in ${file}: Invalid JSON syntax -`, err.message);
    hasError = true;
    continue;
  }

  // Check required root fields
  if (!ruleset.rulesetId || !ruleset.rulesetVersion || !ruleset.destinations || !ruleset.rules) {
    console.error(`[check-rules] ERROR in ${file}: Missing top-level ruleset properties`);
    hasError = true;
    continue;
  }

  const destinationIds = new Set(ruleset.destinations.map((d) => d.id));
  const seenRuleIds = new Set();
  const priorityMap = new Map();

  for (const rule of ruleset.rules) {
    // Unique rule id
    if (seenRuleIds.has(rule.id)) {
      console.error(`[check-rules] ERROR: Duplicate rule ID found: "${rule.id}"`);
      hasError = true;
    }
    seenRuleIds.add(rule.id);

    // Source URL present and valid
    if (!rule.sourceUrl || !rule.sourceUrl.startsWith('http')) {
      console.error(`[check-rules] ERROR in rule "${rule.id}": Missing or invalid sourceUrl`);
      hasError = true;
    }

    // Destination exists
    if (!destinationIds.has(rule.decision.destinationId)) {
      console.error(
        `[check-rules] ERROR in rule "${rule.id}": Points to nonexistent destination "${rule.decision.destinationId}"`
      );
      hasError = true;
    }

    // Non-empty reason and narration
    if (!rule.decision.reason || rule.decision.reason.trim() === '') {
      console.error(`[check-rules] ERROR in rule "${rule.id}": Empty reason string`);
      hasError = true;
    }
    if (!rule.decision.narration || rule.decision.narration.trim() === '') {
      console.error(`[check-rules] ERROR in rule "${rule.id}": Empty narration string`);
      hasError = true;
    }

    // Priority conflict check
    if (priorityMap.has(rule.priority)) {
      const existing = priorityMap.get(rule.priority);
      console.error(
        `[check-rules] ERROR: Priority collision at priority ${rule.priority} between "${existing}" and "${rule.id}"`
      );
      hasError = true;
    } else {
      priorityMap.set(rule.priority, rule.id);
    }
  }

  // Fallback destination check
  if (!destinationIds.has(ruleset.fallback.destinationId)) {
    console.error(
      `[check-rules] ERROR: Fallback points to nonexistent destination "${ruleset.fallback.destinationId}"`
    );
    hasError = true;
  }
}

if (hasError) {
  console.error('[check-rules] FAILED: Ruleset validation errors encountered!');
  process.exit(1);
} else {
  console.log(
    '[check-rules] PASSED: All municipal rulesets are valid, non-overlapping, and fully sourced.'
  );
  process.exit(0);
}
