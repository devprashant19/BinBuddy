import { Classification } from '../schemas/classification';
import { Ruleset } from '../schemas/ruleset';
import { Result, Answers } from '../schemas/result';
import { evaluate } from './engine';
import {
  getMaterialClarification,
  getConditionClarification,
  getResinClarification,
} from './clarify';

export interface RawAnswers {
  material?: string;
  condition?: string;
  resinCode?: string;
}

/**
 * Deterministic gating function.
 * Decides whether a classification can be immediately resolved,
 * requires user clarification, or must fall back to manual inspection.
 */
export function decide(
  classification: Classification,
  answers: RawAnswers = {},
  ruleset: Ruleset,
  threshold = 0.65
): Result {
  // 1. If user explicitly selected "not_sure" on any clarification question, immediately yield manual_check
  if (
    answers.material === 'not_sure' ||
    answers.condition === 'not_sure' ||
    answers.resinCode === 'not_sure'
  ) {
    return {
      status: 'manual_check',
      reason:
        'You indicated uncertainty about this item. Please check the official City of Houston guidance.',
      sourceUrl: ruleset.source.url,
    };
  }

  // 2. Build effective classification with confirmed user overrides
  const effective: Classification = {
    ...classification,
    material: (answers.material as Classification['material']) ?? classification.material,
    condition: (answers.condition as Classification['condition']) ?? classification.condition,
    visibleResinCode:
      (answers.resinCode as Classification['visibleResinCode']) ?? classification.visibleResinCode,
  };

  // 3. Gating checks:
  // (a) Material ambiguity or low model confidence triggers material clarification
  const materialConfirmed = Boolean(answers.material);
  if (!materialConfirmed) {
    if (classification.confidence < threshold || effective.material === 'unknown') {
      return {
        status: 'needs_clarification',
        clarification: getMaterialClarification(),
      };
    }
  }

  // (b) Condition ambiguity triggers condition clarification if item might be recyclable
  const conditionConfirmed = Boolean(answers.condition);
  if (!conditionConfirmed && effective.condition === 'unknown') {
    const conditionRelevantMaterials = [
      'paper',
      'cardboard',
      'plastic',
      'glass',
      'metal',
      'carton',
    ];
    if (conditionRelevantMaterials.includes(effective.material)) {
      return {
        status: 'needs_clarification',
        clarification: getConditionClarification(),
      };
    }
  }

  // (c) Plastic resin code ambiguity triggers resin clarification
  const resinConfirmed = Boolean(answers.resinCode);
  if (
    !resinConfirmed &&
    effective.material === 'plastic' &&
    ['bottle', 'jar', 'food_container', 'other'].includes(effective.itemType) &&
    (effective.visibleResinCode === 'not_visible' ||
      effective.visibleResinCode === 'not_applicable')
  ) {
    return {
      status: 'needs_clarification',
      clarification: getResinClarification(),
    };
  }

  // 4. Run pure engine evaluation
  const decision = evaluate(effective, ruleset);

  if (decision.decisionType === 'manual_check') {
    return {
      status: 'manual_check',
      reason: decision.reason,
      sourceUrl: decision.sourceUrl,
    };
  }

  return {
    status: 'decided',
    decision,
    rulesetVersion: ruleset.rulesetVersion,
  };
}
