export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageValidationResult {
  valid: boolean;
  mime?: SupportedImageMime;
  errorCode?: 'INVALID_IMAGE' | 'UNSUPPORTED_TYPE' | 'IMAGE_TOO_LARGE';
  message?: string;
  hint?: string;
}

/**
 * Validates in-memory image buffer against magic bytes, supported formats, and size limits.
 * Images are never written to disk or logged.
 */
export function validateImageBuffer(
  buffer: Buffer,
  declaredMime?: string,
  maxUploadMb = 8
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      errorCode: 'INVALID_IMAGE',
      message: 'Empty image buffer received.',
      hint: 'Please select a valid image file from your camera or photos.',
    };
  }

  const maxBytes = maxUploadMb * 1024 * 1024;
  if (buffer.length > maxBytes) {
    return {
      valid: false,
      errorCode: 'IMAGE_TOO_LARGE',
      message: `Image exceeds maximum permitted size of ${maxUploadMb} MB.`,
      hint: 'Compress or resize the image before uploading.',
    };
  }

  // Detect format via magic bytes
  let detectedMime: SupportedImageMime | null = null;

  // 1. JPEG check: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    detectedMime = 'image/jpeg';
  }

  // 2. PNG check: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedMime = 'image/png';
  }

  // 3. WebP check: RIFF....WEBP
  else if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    detectedMime = 'image/webp';
  }

  if (!detectedMime) {
    return {
      valid: false,
      errorCode: 'UNSUPPORTED_TYPE',
      message: 'File is not a supported image format. Only JPEG, PNG, and WebP are allowed.',
      hint: 'Take a new photo or select a JPEG, PNG, or WebP image.',
    };
  }

  // Verify declared mime matches detected mime (if provided)
  if (declaredMime) {
    const normalizedDeclared = declaredMime.toLowerCase().trim();
    if (
      normalizedDeclared !== detectedMime &&
      !(detectedMime === 'image/jpeg' && normalizedDeclared === 'image/jpg')
    ) {
      return {
        valid: false,
        errorCode: 'INVALID_IMAGE',
        message: `MIME type mismatch: declared "${declaredMime}" but magic bytes indicate "${detectedMime}".`,
        hint: 'Ensure your file extension matches its actual contents.',
      };
    }
  }

  return {
    valid: true,
    mime: detectedMime,
  };
}
