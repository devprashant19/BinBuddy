import { z } from 'zod';

export const itemTypeEnum = z.enum([
  'bottle',
  'jar',
  'can',
  'cardboard_box',
  'paper',
  'carton',
  'plastic_film',
  'foam_packaging',
  'battery',
  'electronics',
  'textile',
  'food_container',
  'other',
  'unknown',
]);

export const materialEnum = z.enum([
  'paper',
  'cardboard',
  'plastic',
  'glass',
  'metal',
  'carton',
  'organic',
  'textile',
  'electronic',
  'battery',
  'composite',
  'unknown',
]);

export const conditionEnum = z.enum(['clean', 'soiled', 'unknown']);

export const resinCodeEnum = z.enum([
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  'not_visible',
  'not_applicable',
]);

export const classificationSchema = z
  .object({
    itemType: itemTypeEnum,
    material: materialEnum,
    condition: conditionEnum,
    visibleResinCode: resinCodeEnum,
    confidence: z.number().min(0).max(1),
    shortDescription: z.string().min(1).max(120),
  })
  .strict();

export type ItemType = z.infer<typeof itemTypeEnum>;
export type Material = z.infer<typeof materialEnum>;
export type Condition = z.infer<typeof conditionEnum>;
export type ResinCode = z.infer<typeof resinCodeEnum>;
export type Classification = z.infer<typeof classificationSchema>;
