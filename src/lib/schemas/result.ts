import { z } from 'zod';
import { materialEnum, conditionEnum, resinCodeEnum } from './classification';
import { decisionTypeEnum } from './ruleset';

export const decisionSchema = z.object({
  ruleId: z.string().min(1),
  decisionType: decisionTypeEnum,
  destinationId: z.string().min(1),
  reason: z.string().min(1),
  sourceUrl: z.string().url(),
  matchedBecause: z.array(z.string()),
});

export const clarificationIdEnum = z.enum(['material', 'condition', 'resin']);

export const clarificationOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const clarificationSchema = z.object({
  id: clarificationIdEnum,
  question: z.string().min(1),
  options: z.array(clarificationOptionSchema).min(2),
});

export const decidedResultSchema = z.object({
  status: z.literal('decided'),
  decision: decisionSchema,
  rulesetVersion: z.string().min(1),
});

export const needsClarificationResultSchema = z.object({
  status: z.literal('needs_clarification'),
  clarification: clarificationSchema,
});

export const manualCheckResultSchema = z.object({
  status: z.literal('manual_check'),
  reason: z.string().min(1),
  sourceUrl: z.string().url(),
});

export const resultSchema = z.discriminatedUnion('status', [
  decidedResultSchema,
  needsClarificationResultSchema,
  manualCheckResultSchema,
]);

export const answersSchema = z.object({
  material: materialEnum.optional(),
  condition: conditionEnum.optional(),
  resinCode: resinCodeEnum.optional(),
});

export type Decision = z.infer<typeof decisionSchema>;
export type ClarificationId = z.infer<typeof clarificationIdEnum>;
export type ClarificationOption = z.infer<typeof clarificationOptionSchema>;
export type Clarification = z.infer<typeof clarificationSchema>;
export type DecidedResult = z.infer<typeof decidedResultSchema>;
export type NeedsClarificationResult = z.infer<typeof needsClarificationResultSchema>;
export type ManualCheckResult = z.infer<typeof manualCheckResultSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Answers = z.infer<typeof answersSchema>;
