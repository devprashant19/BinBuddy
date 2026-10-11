import { NextResponse } from 'next/server';
import { ErrorCode, ApiError } from '../schemas/errors';

const STATUS_MAP: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  INVALID_IMAGE: 400,
  UNSUPPORTED_TYPE: 415,
  IMAGE_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  RULE_NOT_FOUND: 404,
  CLASSIFIER_UNAVAILABLE: 503,
  CLASSIFIER_BAD_OUTPUT: 502,
  VOICE_UNAVAILABLE: 503,
};

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  hint: string,
  requestId?: string
): NextResponse<ApiError> {
  const status = STATUS_MAP[code] || 500;
  return NextResponse.json(
    {
      error: {
        code,
        message,
        hint,
        requestId,
      },
    },
    { status }
  );
}
