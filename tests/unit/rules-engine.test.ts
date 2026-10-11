import { describe, it, expect, beforeEach } from 'vitest';
import { loadRuleset } from '@/lib/rules/load';
import { evaluate, sortRules } from '@/lib/rules/engine';
import { decide } from '@/lib/rules/gating';
import { Classification, classificationSchema } from '@/lib/schemas/classification';
import { Ruleset, rulesetSchema } from '@/lib/schemas/ruleset';
import fixturesData from '../../data/fixtures/classification-fixtures.json';
import fs from 'fs';
import path from 'path';

describe('Rules Engine & Houston Municipal Ruleset', () => {
  let ruleset: Ruleset;

  beforeEach(() => {
    ruleset = loadRuleset('houston-tx-curbside');
  });

  describe('Ruleset Schema & Integrity', () => {
    it('validates official houston ruleset matches schema', () => {
      const parsed = rulesetSchema.safeParse(ruleset);
      expect(parsed.success).toBe(true);
      expect(ruleset.rulesetId).toBe('houston-tx-curbside');
      expect(ruleset.draft).toBe(false);
      expect(ruleset.rules.length).toBeGreaterThanOrEqual(14);
    });

    it('returns cached ruleset on second load call', () => {
      const cached = loadRuleset('houston-tx-curbside');
      expect(cached).toBe(ruleset);
    });

    it('throws when ruleset file does not exist', () => {
      expect(() => loadRuleset('non-existent-city')).toThrow(/Ruleset file not found/);
    });

    it('throws when ruleset JSON fails schema validation', () => {
      const badPath = path.resolve(process.cwd(), 'data/rules/invalid-schema.json');
      fs.writeFileSync(badPath, JSON.stringify({ rulesetId: 123 }), 'utf-8');
      try {
        expect(() => loadRuleset('invalid-schema')).toThrow(/Ruleset validation failed/);
      } finally {
        if (fs.existsSync(badPath)) fs.unlinkSync(badPath);
      }
    });

    it('throws when ruleset JSON is malformed syntax', () => {
      const badPath = path.resolve(process.cwd(), 'data/rules/malformed-syntax.json');
      fs.writeFileSync(badPath, 'INVALID_JSON{', 'utf-8');
      try {
        expect(() => loadRuleset('malformed-syntax')).toThrow(/Failed to parse ruleset JSON/);
      } finally {
        if (fs.existsSync(badPath)) fs.unlinkSync(badPath);
      }
    });

    it('throws when fallback points to nonexistent destination', () => {
      const badRuleset = JSON.parse(JSON.stringify(ruleset));
      badRuleset.fallback.destinationId = 'non_existent_fallback_destination';
      const badPath = path.resolve(process.cwd(), 'data/rules/test-invalid-fallback.json');
      fs.writeFileSync(badPath, JSON.stringify(badRuleset), 'utf-8');

      try {
        expect(() => loadRuleset('test-invalid-fallback')).toThrow(
          /Fallback points to unknown destination/
        );
      } finally {
        if (fs.existsSync(badPath)) fs.unlinkSync(badPath);
      }
    });

    it('rejects ruleset with missing mandatory properties', () => {
      expect(() => {
        rulesetSchema.parse({ rulesetId: 'broken' });
      }).toThrow();
    });

    it('rejects ruleset pointing to undefined destination', () => {
      const badRuleset = JSON.parse(JSON.stringify(ruleset));
      badRuleset.rules[0].decision.destinationId = 'non_existent_destination';
      const badPath = path.resolve(process.cwd(), 'data/rules/test-invalid-dest.json');
      fs.writeFileSync(badPath, JSON.stringify(badRuleset), 'utf-8');

      try {
        expect(() => loadRuleset('test-invalid-dest')).toThrow(/unknown destination/);
      } finally {
        if (fs.existsSync(badPath)) fs.unlinkSync(badPath);
      }
    });
  });

  describe('Table-driven Rule Evaluation (>40 test cases)', () => {
    const cases: Array<{
      desc: string;
      item: Classification;
      expectedDestination: string;
      expectedType: string;
    }> = [
      // 1. Metal cans
      {
        desc: 'Clean aluminum soda can -> recycling',
        item: {
          itemType: 'can',
          material: 'metal',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.95,
          shortDescription: 'Aluminum soda can',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean tin soup can -> recycling',
        item: {
          itemType: 'can',
          material: 'metal',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.9,
          shortDescription: 'Tin food can',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Soiled metal can -> fallback/manual check (not clean)',
        item: {
          itemType: 'can',
          material: 'metal',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.9,
          shortDescription: 'Food-soiled can',
        },
        expectedDestination: 'manual_check',
        expectedType: 'manual_check',
      },

      // 2. Glass containers
      {
        desc: 'Clean glass beer bottle -> recycling',
        item: {
          itemType: 'bottle',
          material: 'glass',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.95,
          shortDescription: 'Glass beverage bottle',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean glass pickle jar -> recycling',
        item: {
          itemType: 'jar',
          material: 'glass',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.92,
          shortDescription: 'Glass pickle jar',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Soiled glass jar -> manual_check',
        item: {
          itemType: 'jar',
          material: 'glass',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.88,
          shortDescription: 'Oily glass jar',
        },
        expectedDestination: 'manual_check',
        expectedType: 'manual_check',
      },

      // 3. Cardboard & Paper
      {
        desc: 'Clean shipping cardboard box -> recycling',
        item: {
          itemType: 'cardboard_box',
          material: 'cardboard',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.96,
          shortDescription: 'Brown shipping box',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean newspaper -> recycling',
        item: {
          itemType: 'paper',
          material: 'paper',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.91,
          shortDescription: 'Daily newspaper',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean office printer paper -> recycling',
        item: {
          itemType: 'paper',
          material: 'paper',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.93,
          shortDescription: 'White printed papers',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Greasy pizza box (soiled cardboard) -> trash',
        item: {
          itemType: 'cardboard_box',
          material: 'cardboard',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.94,
          shortDescription: 'Oily pizza box',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },
      {
        desc: 'Soiled paper napkin / tissue -> trash',
        item: {
          itemType: 'paper',
          material: 'paper',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.9,
          shortDescription: 'Greasy paper napkin',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },

      // 4. Cartons
      {
        desc: 'Clean milk carton -> recycling',
        item: {
          itemType: 'carton',
          material: 'carton',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.9,
          shortDescription: 'Gable-top milk carton',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean juice carton -> recycling',
        item: {
          itemType: 'carton',
          material: 'carton',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.91,
          shortDescription: 'Shelf-stable juice box',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },

      // 5. Plastic containers with resin codes
      {
        desc: 'Clean plastic #1 PET water bottle -> recycling',
        item: {
          itemType: 'bottle',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '1',
          confidence: 0.95,
          shortDescription: 'PET bottle',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean plastic #2 HDPE milk jug -> recycling',
        item: {
          itemType: 'bottle',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '2',
          confidence: 0.94,
          shortDescription: 'HDPE milk jug',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean plastic #5 PP yogurt tub -> recycling',
        item: {
          itemType: 'food_container',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '5',
          confidence: 0.92,
          shortDescription: 'PP yogurt tub',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean plastic #7 other container -> recycling',
        item: {
          itemType: 'food_container',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '7',
          confidence: 0.88,
          shortDescription: 'Number 7 container',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Plastic #6 polystyrene / Styrofoam -> trash',
        item: {
          itemType: 'foam_packaging',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '6',
          confidence: 0.92,
          shortDescription: 'Styrofoam takeaway cup',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },

      // 6. Plastic film & bags
      {
        desc: 'Plastic grocery film bag -> trash',
        item: {
          itemType: 'plastic_film',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '4',
          confidence: 0.93,
          shortDescription: 'Plastic shopping bag',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },
      {
        desc: 'Plastic stretch cling wrap -> trash',
        item: {
          itemType: 'plastic_film',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.89,
          shortDescription: 'Case wrap plastic film',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },

      // 7. Hazardous & Special items
      {
        desc: 'Lithium or alkaline battery -> special handling',
        item: {
          itemType: 'battery',
          material: 'battery',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.98,
          shortDescription: 'AA Battery',
        },
        expectedDestination: 'special_handling',
        expectedType: 'special_handling',
      },
      {
        desc: 'Electronics device (smartphone/cable) -> special handling',
        item: {
          itemType: 'electronics',
          material: 'electronic',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.95,
          shortDescription: 'Broken smartphone',
        },
        expectedDestination: 'special_handling',
        expectedType: 'special_handling',
      },

      // 8. Non-recyclable organics, textiles, composites
      {
        desc: 'Cotton t-shirt / clothing textile -> trash',
        item: {
          itemType: 'textile',
          material: 'textile',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.91,
          shortDescription: 'Old cotton t-shirt',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },
      {
        desc: 'Food waste apple core / organic -> trash',
        item: {
          itemType: 'other',
          material: 'organic',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.94,
          shortDescription: 'Apple core organic food waste',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },
      {
        desc: 'Composite packaging pouch -> manual check',
        item: {
          itemType: 'food_container',
          material: 'composite',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.89,
          shortDescription: 'Multi-layer foil-plastic pouch',
        },
        expectedDestination: 'manual_check',
        expectedType: 'manual_check',
      },

      // 9. Combinations of material x condition
      {
        desc: 'Plastic clean bottle #3 -> recycling',
        item: {
          itemType: 'bottle',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '3',
          confidence: 0.9,
          shortDescription: 'Clear #3 plastic bottle',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Plastic clean bottle #4 -> recycling',
        item: {
          itemType: 'bottle',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '4',
          confidence: 0.9,
          shortDescription: 'Plastic #4 bottle',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Carton soiled -> manual check / fallback',
        item: {
          itemType: 'carton',
          material: 'carton',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.85,
          shortDescription: 'Spoiled unrinsed milk carton',
        },
        expectedDestination: 'manual_check',
        expectedType: 'manual_check',
      },
      {
        desc: 'Foam packaging without visible resin -> trash',
        item: {
          itemType: 'foam_packaging',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: 'not_visible',
          confidence: 0.87,
          shortDescription: 'Foam clamshell',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },
      {
        desc: 'Textile soiled -> trash',
        item: {
          itemType: 'textile',
          material: 'textile',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.92,
          shortDescription: 'Dirty rag',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },
      {
        desc: 'Organic clean -> trash',
        item: {
          itemType: 'other',
          material: 'organic',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.9,
          shortDescription: 'Clean banana peel',
        },
        expectedDestination: 'trash_cart',
        expectedType: 'trash',
      },
      {
        desc: 'Composite soiled -> manual check',
        item: {
          itemType: 'food_container',
          material: 'composite',
          condition: 'soiled',
          visibleResinCode: 'not_applicable',
          confidence: 0.9,
          shortDescription: 'Soiled composite bag',
        },
        expectedDestination: 'manual_check',
        expectedType: 'manual_check',
      },
      {
        desc: 'Unknown material and type -> manual check fallback',
        item: {
          itemType: 'unknown',
          material: 'unknown',
          condition: 'unknown',
          visibleResinCode: 'not_visible',
          confidence: 0.5,
          shortDescription: 'Unknown blurry object',
        },
        expectedDestination: 'manual_check',
        expectedType: 'manual_check',
      },
      {
        desc: 'Clean magazine paper -> recycling',
        item: {
          itemType: 'paper',
          material: 'paper',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.95,
          shortDescription: 'Glossy magazine',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean cardboard cereal box -> recycling',
        item: {
          itemType: 'cardboard_box',
          material: 'cardboard',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.93,
          shortDescription: 'Cardboard cereal box',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean glass wine bottle -> recycling',
        item: {
          itemType: 'bottle',
          material: 'glass',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.95,
          shortDescription: 'Green glass wine bottle',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean aluminum cat food can -> recycling',
        item: {
          itemType: 'can',
          material: 'metal',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.92,
          shortDescription: 'Cat food can',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Electronics cable -> special handling',
        item: {
          itemType: 'electronics',
          material: 'electronic',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.88,
          shortDescription: 'USB charging cable',
        },
        expectedDestination: 'special_handling',
        expectedType: 'special_handling',
      },
      {
        desc: 'Li-ion battery pack -> special handling',
        item: {
          itemType: 'battery',
          material: 'battery',
          condition: 'clean',
          visibleResinCode: 'not_applicable',
          confidence: 0.96,
          shortDescription: 'Phone battery pack',
        },
        expectedDestination: 'special_handling',
        expectedType: 'special_handling',
      },
      {
        desc: 'Clean plastic jar #1 -> recycling',
        item: {
          itemType: 'jar',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '1',
          confidence: 0.92,
          shortDescription: 'Plastic peanut butter jar',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
      {
        desc: 'Clean plastic jar #2 -> recycling',
        item: {
          itemType: 'jar',
          material: 'plastic',
          condition: 'clean',
          visibleResinCode: '2',
          confidence: 0.91,
          shortDescription: 'HDPE plastic container',
        },
        expectedDestination: 'recycling_cart',
        expectedType: 'recycle',
      },
    ];

    it.each(cases)('$desc', ({ item, expectedDestination, expectedType }) => {
      const decision = evaluate(item, ruleset);
      expect(decision.destinationId).toBe(expectedDestination);
      expect(decision.decisionType).toBe(expectedType);
    });
  });

  describe('Verification Against All Fixtures', () => {
    it('evaluates all 8 fixtures from classification-fixtures.json', () => {
      for (const fixture of fixturesData) {
        const validated = classificationSchema.parse(fixture.classification);
        const result = decide(validated, {}, ruleset);
        expect(result.status).toBeDefined();

        if (fixture.id === 'blurry-unknown') {
          // Low confidence (0.28) triggers clarification
          expect(result.status).toBe('needs_clarification');
        } else if (fixture.id === 'pizza-box-greasy') {
          expect(result.status).toBe('decided');
          if (result.status === 'decided') {
            expect(result.decision.destinationId).toBe('trash_cart');
          }
        } else if (fixture.id === 'plastic-bag') {
          expect(result.status).toBe('decided');
          if (result.status === 'decided') {
            expect(result.decision.destinationId).toBe('trash_cart');
          }
        } else if (fixture.id === 'battery') {
          expect(result.status).toBe('decided');
          if (result.status === 'decided') {
            expect(result.decision.destinationId).toBe('special_handling');
          }
        }
      }
    });
  });

  describe('Core Invariants', () => {
    it('unknown material or unknown itemType never yields recycle', () => {
      const unknownMaterial: Classification = {
        itemType: 'can',
        material: 'unknown',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.9,
        shortDescription: 'Item with unknown material',
      };
      const decision1 = evaluate(unknownMaterial, ruleset);
      expect(decision1.decisionType).not.toBe('recycle');

      const unknownType: Classification = {
        itemType: 'unknown',
        material: 'metal',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.9,
        shortDescription: 'Item with unknown itemType',
      };
      const decision2 = evaluate(unknownType, ruleset);
      expect(decision2.decisionType).not.toBe('recycle');
    });

    it('battery and electronics never yield recycling_cart', () => {
      const batteryItem: Classification = {
        itemType: 'battery',
        material: 'battery',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.99,
        shortDescription: 'Battery',
      };
      expect(evaluate(batteryItem, ruleset).destinationId).not.toBe('recycling_cart');

      const electronicItem: Classification = {
        itemType: 'electronics',
        material: 'electronic',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.99,
        shortDescription: 'Laptop motherboard',
      };
      expect(evaluate(electronicItem, ruleset).destinationId).not.toBe('recycling_cart');
    });

    it('plastic film follows official guidance (trash_cart, never recycling_cart)', () => {
      const film: Classification = {
        itemType: 'plastic_film',
        material: 'plastic',
        condition: 'clean',
        visibleResinCode: '4',
        confidence: 0.95,
        shortDescription: 'Produce bag',
      };
      const decision = evaluate(film, ruleset);
      expect(decision.destinationId).toBe('trash_cart');
      expect(decision.decisionType).toBe('trash');
    });

    it('pure evaluation is 100% deterministic across 1000 repeated calls', () => {
      const item: Classification = {
        itemType: 'bottle',
        material: 'plastic',
        condition: 'clean',
        visibleResinCode: '1',
        confidence: 0.95,
        shortDescription: 'Plastic bottle',
      };

      const baseline = evaluate(item, ruleset);
      for (let i = 0; i < 1000; i++) {
        const next = evaluate(item, ruleset);
        expect(next.ruleId).toBe(baseline.ruleId);
        expect(next.destinationId).toBe(baseline.destinationId);
      }
    });

    it('shuffling rules array does not change evaluation results (priority stability)', () => {
      const item: Classification = {
        itemType: 'can',
        material: 'metal',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.95,
        shortDescription: 'Aluminum can',
      };

      const originalDecision = evaluate(item, ruleset);

      // Create shuffled ruleset
      const shuffledRules = [...ruleset.rules].sort(() => Math.random() - 0.5);
      const shuffledRuleset: Ruleset = {
        ...ruleset,
        rules: shuffledRules,
      };

      const shuffledDecision = evaluate(item, shuffledRuleset);
      expect(shuffledDecision.ruleId).toBe(originalDecision.ruleId);
      expect(shuffledDecision.destinationId).toBe(originalDecision.destinationId);
    });
  });

  describe('Gating and Clarification Logic', () => {
    it('triggers material clarification when confidence is just below threshold (0.64 vs 0.65)', () => {
      const lowConfidence: Classification = {
        itemType: 'can',
        material: 'metal',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.64,
        shortDescription: 'Doubtful can',
      };
      const result = decide(lowConfidence, {}, ruleset, 0.65);
      expect(result.status).toBe('needs_clarification');
      if (result.status === 'needs_clarification') {
        expect(result.clarification.id).toBe('material');
      }
    });

    it('resolves directly when confidence is at or above threshold (0.65)', () => {
      const adequateConfidence: Classification = {
        itemType: 'can',
        material: 'metal',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.65,
        shortDescription: 'Identified can',
      };
      const result = decide(adequateConfidence, {}, ruleset, 0.65);
      expect(result.status).toBe('decided');
    });

    it('triggers condition clarification when condition is unknown on potentially recyclable item', () => {
      const unknownCondition: Classification = {
        itemType: 'cardboard_box',
        material: 'cardboard',
        condition: 'unknown',
        visibleResinCode: 'not_applicable',
        confidence: 0.9,
        shortDescription: 'Cardboard box with unknown cleanliness',
      };
      const result = decide(unknownCondition, {}, ruleset);
      expect(result.status).toBe('needs_clarification');
      if (result.status === 'needs_clarification') {
        expect(result.clarification.id).toBe('condition');
      }
    });

    it('triggers resin code clarification for plastic container when resin code is not visible', () => {
      const unknownResin: Classification = {
        itemType: 'bottle',
        material: 'plastic',
        condition: 'clean',
        visibleResinCode: 'not_visible',
        confidence: 0.9,
        shortDescription: 'Plastic bottle without visible number',
      };
      const result = decide(unknownResin, {}, ruleset);
      expect(result.status).toBe('needs_clarification');
      if (result.status === 'needs_clarification') {
        expect(result.clarification.id).toBe('resin');
      }
    });

    it('user answer overrides model classification and confirms field', () => {
      const misclassified: Classification = {
        itemType: 'bottle',
        material: 'unknown',
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.3,
        shortDescription: 'Unclear item',
      };

      // User confirms it is glass
      const result = decide(misclassified, { material: 'glass' }, ruleset);
      expect(result.status).toBe('decided');
      if (result.status === 'decided') {
        expect(result.decision.destinationId).toBe('recycling_cart');
      }
    });

    it('user answering "not_sure" immediately yields manual_check with official source link', () => {
      const item: Classification = {
        itemType: 'cardboard_box',
        material: 'cardboard',
        condition: 'unknown',
        visibleResinCode: 'not_applicable',
        confidence: 0.9,
        shortDescription: 'Box',
      };

      const result = decide(item, { condition: 'not_sure' }, ruleset);
      expect(result.status).toBe('manual_check');
      if (result.status === 'manual_check') {
        expect(result.sourceUrl).toBe(ruleset.source.url);
      }
    });

    it('prevents infinite clarification loops by honoring answered questions', () => {
      const item: Classification = {
        itemType: 'bottle',
        material: 'plastic',
        condition: 'unknown',
        visibleResinCode: 'not_visible',
        confidence: 0.5,
        shortDescription: 'Low confidence plastic bottle',
      };

      // Step 1: asks material
      const step1 = decide(item, {}, ruleset);
      expect(step1.status).toBe('needs_clarification');
      if (step1.status === 'needs_clarification') {
        expect(step1.clarification.id).toBe('material');
      }

      // Step 2: user answers material: 'plastic', now asks condition
      const step2 = decide(item, { material: 'plastic' }, ruleset);
      expect(step2.status).toBe('needs_clarification');
      if (step2.status === 'needs_clarification') {
        expect(step2.clarification.id).toBe('condition');
      }

      // Step 3: user answers condition: 'clean', now asks resin
      const step3 = decide(item, { material: 'plastic', condition: 'clean' }, ruleset);
      expect(step3.status).toBe('needs_clarification');
      if (step3.status === 'needs_clarification') {
        expect(step3.clarification.id).toBe('resin');
      }

      // Step 4: user answers resin: '1', now decided!
      const step4 = decide(
        item,
        { material: 'plastic', condition: 'clean', resinCode: '1' },
        ruleset
      );
      expect(step4.status).toBe('decided');
      if (step4.status === 'decided') {
        expect(step4.decision.destinationId).toBe('recycling_cart');
      }
    });

    it('returns manual_check when evaluation yields fallback manual check', () => {
      const oddItem: Classification = {
        itemType: 'other',
        material: 'other' as any,
        condition: 'clean',
        visibleResinCode: 'not_applicable',
        confidence: 0.99,
        shortDescription: 'Odd item with no matching rules',
      };
      const result = decide(oddItem, { material: 'other' as any }, ruleset);
      expect(result.status).toBe('manual_check');
      if (result.status === 'manual_check') {
        expect(result.reason).toContain('No verified City of Houston rule');
      }
    });

    it('breaks priority ties deterministically by alphabetical rule id in sortRules', () => {
      const rules = [
        {
          id: 'rule-z',
          priority: 50,
          match: {},
          decision: {
            type: 'trash' as const,
            destinationId: 'trash_cart',
            reason: 'z',
            narration: 'z',
          },
          sourceUrl: 'https://example.com',
        },
        {
          id: 'rule-a',
          priority: 50,
          match: {},
          decision: {
            type: 'trash' as const,
            destinationId: 'trash_cart',
            reason: 'a',
            narration: 'a',
          },
          sourceUrl: 'https://example.com',
        },
      ];
      const sorted = sortRules(rules);
      expect(sorted[0].id).toBe('rule-a');
      expect(sorted[1].id).toBe('rule-z');
    });
  });
});
