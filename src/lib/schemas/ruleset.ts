import { z } from 'zod';
import { materialEnum, itemTypeEnum, conditionEnum, resinCodeEnum } from './classification';

export const destinationToneEnum = z.enum(['recycle', 'landfill', 'special', 'manual', 'yard']);

export const destinationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tone: destinationToneEnum,
  description: z.string().min(1),
});

export const decisionTypeEnum = z.enum(['recycle', 'trash', 'special_handling', 'manual_check']);

export const ruleMatchSchema = z.object({
  materials: z.array(materialEnum).optional(),
  itemTypes: z.array(itemTypeEnum).optional(),
  conditions: z.array(conditionEnum).optional(),
  resinCodes: z.array(resinCodeEnum).optional(),
});

export const ruleDecisionSchema = z.object({
  type: decisionTypeEnum,
  destinationId: z.string().min(1),
  reason: z.string().min(1),
  narration: z.string().min(1),
});

export const ruleSchema = z.object({
  id: z.string().min(1),
  priority: z.number().int(),
  match: ruleMatchSchema,
  decision: ruleDecisionSchema,
  sourceUrl: z.string().url(),
});

export const fallbackDecisionSchema = z.object({
  type: decisionTypeEnum,
  destinationId: z.string().min(1),
  reason: z.string().min(1),
  narration: z.string().min(1),
});

export const rulesetSchema = z.object({
  rulesetId: z.string().min(1),
  rulesetVersion: z.string().min(1),
  draft: z.boolean(),
  city: z.object({
    name: z.string().min(1),
    region: z.string().min(1),
    country: z.string().min(1),
  }),
  source: z.object({
    name: z.string().min(1),
    url: z.string().url(),
    lastVerifiedAt: z.string().min(1),
  }),
  destinations: z.array(destinationSchema).min(1),
  rules: z.array(ruleSchema).min(1),
  fallback: fallbackDecisionSchema,
});

export type DestinationTone = z.infer<typeof destinationToneEnum>;
export type Destination = z.infer<typeof destinationSchema>;
export type DecisionType = z.infer<typeof decisionTypeEnum>;
export type RuleMatch = z.infer<typeof ruleMatchSchema>;
export type RuleDecision = z.infer<typeof ruleDecisionSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type FallbackDecision = z.infer<typeof fallbackDecisionSchema>;
export type Ruleset = z.infer<typeof rulesetSchema>;
