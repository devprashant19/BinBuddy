import { z } from 'zod';

export const errorCodeEnum = z.enum([
  'BAD_REQUEST',
  'INVALID_IMAGE',
  'UNSUPPORTED_TYPE',
  'IMAGE_TOO_LARGE',
  'RATE_LIMITED',
  'CLASSIFIER_UNAVAILABLE',
  'CLASSIFIER_BAD_OUTPUT',
  'RULE_NOT_FOUND',
  'VOICE_UNAVAILABLE',
]);

export const apiErrorSchema = z.object({
  error: z.object({
    code: errorCodeEnum,
    message: z.string().min(1),
    hint: z.string().min(1),
    requestId: z.string().optional(),
  }),
});

export type ErrorCode = z.infer<typeof errorCodeEnum>;
export type ApiError = z.infer<typeof apiErrorSchema>;
