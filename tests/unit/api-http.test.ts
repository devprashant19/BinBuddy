import { describe, it, expect, beforeEach } from 'vitest';
import { validateImageBuffer } from '@/lib/http/image-validate';
import { checkRateLimit, resetRateLimitStore } from '@/lib/http/rate-limit';
import { createErrorResponse } from '@/lib/http/errors';
import { generateRequestId } from '@/lib/http/request-id';
import { mockProvider } from '@/lib/providers/mock';
import fixturesData from '../../data/fixtures/classification-fixtures.json';

describe('HTTP Layer & Image Validation', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe('Image Buffer Validation (Magic Bytes & Boundaries)', () => {
    it('accepts valid JPEG buffer by magic bytes', () => {
      // JPEG magic: FF D8 FF
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const res = validateImageBuffer(jpeg, 'image/jpeg');
      expect(res.valid).toBe(true);
      expect(res.mime).toBe('image/jpeg');
    });

    it('accepts valid PNG buffer by magic bytes', () => {
      // PNG magic: 89 50 4E 47 0D 0A 1A 0A
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const res = validateImageBuffer(png, 'image/png');
      expect(res.valid).toBe(true);
      expect(res.mime).toBe('image/png');
    });

    it('accepts valid WebP buffer by magic bytes', () => {
      // WebP magic: RIFF....WEBP
      const webp = Buffer.alloc(16);
      webp.write('RIFF', 0);
      webp.write('WEBP', 8);
      const res = validateImageBuffer(webp, 'image/webp');
      expect(res.valid).toBe(true);
      expect(res.mime).toBe('image/webp');
    });

    it('rejects empty buffer with INVALID_IMAGE', () => {
      const res = validateImageBuffer(Buffer.alloc(0));
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe('INVALID_IMAGE');
    });

    it('rejects spoofed text file with image/png declared MIME as UNSUPPORTED_TYPE', () => {
      const textBuffer = Buffer.from('This is a text file posing as an image');
      const res = validateImageBuffer(textBuffer, 'image/png');
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe('UNSUPPORTED_TYPE');
    });

    it('rejects MIME mismatch when magic bytes differ from declared type', () => {
      // Valid PNG bytes declared as image/jpeg
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const res = validateImageBuffer(png, 'image/jpeg');
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe('INVALID_IMAGE');
      expect(res.message).toContain('MIME type mismatch');
    });

    it('rejects buffer exceeding MAX_UPLOAD_MB with IMAGE_TOO_LARGE', () => {
      // 9 MB buffer
      const largeBuffer = Buffer.alloc(9 * 1024 * 1024);
      largeBuffer[0] = 0xff;
      largeBuffer[1] = 0xd8;
      largeBuffer[2] = 0xff;
      const res = validateImageBuffer(largeBuffer, 'image/jpeg', 8);
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe('IMAGE_TOO_LARGE');
    });
  });

  describe('Rate Limiter', () => {
    it('permits requests under the limit and tracks remaining quota', () => {
      const r1 = checkRateLimit('192.168.1.1', 'classify', 5, 60);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(4);

      const r2 = checkRateLimit('192.168.1.1', 'classify', 5, 60);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(3);
    });

    it('blocks requests once limit is reached and provides reset seconds', () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit('10.0.0.1', 'test_group', 3, 60);
      }
      const tripped = checkRateLimit('10.0.0.1', 'test_group', 3, 60);
      expect(tripped.allowed).toBe(false);
      expect(tripped.remaining).toBe(0);
      expect(tripped.resetInSeconds).toBeGreaterThan(0);
    });

    it('isolates different IP addresses', () => {
      for (let i = 0; i < 2; i++) {
        checkRateLimit('1.1.1.1', 'api', 2, 60);
      }
      expect(checkRateLimit('1.1.1.1', 'api', 2, 60).allowed).toBe(false);
      // Different IP is unaffected
      expect(checkRateLimit('2.2.2.2', 'api', 2, 60).allowed).toBe(true);
    });
  });

  describe('Error Response Formatting', () => {
    it('creates standard uniform error schema with correct HTTP status', async () => {
      const reqId = generateRequestId();
      const res = createErrorResponse(
        'INVALID_IMAGE',
        'Image validation failed',
        'Upload a clean image',
        reqId
      );
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('INVALID_IMAGE');
      expect(json.error.message).toBe('Image validation failed');
      expect(json.error.hint).toBe('Upload a clean image');
      expect(json.error.requestId).toBe(reqId);
    });

    it('maps UNSUPPORTED_TYPE to 415 and RATE_LIMITED to 429', () => {
      expect(createErrorResponse('UNSUPPORTED_TYPE', 'm', 'h').status).toBe(415);
      expect(createErrorResponse('RATE_LIMITED', 'm', 'h').status).toBe(429);
      expect(createErrorResponse('IMAGE_TOO_LARGE', 'm', 'h').status).toBe(413);
      expect(createErrorResponse('RULE_NOT_FOUND', 'm', 'h').status).toBe(404);
      expect(createErrorResponse('CLASSIFIER_UNAVAILABLE', 'm', 'h').status).toBe(503);
    });
  });

  describe('Mock Provider', () => {
    it('retrieves fixtures by ID accurately', () => {
      const bottle = mockProvider.getByFixtureId('plastic-bottle-clean');
      expect(bottle).not.toBeNull();
      expect(bottle?.material).toBe('plastic');
      expect(bottle?.itemType).toBe('bottle');
    });

    it('returns null for unknown fixture ID', () => {
      expect(mockProvider.getByFixtureId('non-existent')).toBeNull();
    });

    it('deterministically classifies image bytes by hash', async () => {
      const bytes = Buffer.from('test-image-data-sample');
      const c1 = await mockProvider.classify({ bytes, mime: 'image/jpeg' });
      const c2 = await mockProvider.classify({ bytes, mime: 'image/jpeg' });
      expect(c1.shortDescription).toBe(c2.shortDescription);
      expect(c1.material).toBe(c2.material);
    });

    it('processes images purely in-memory without creating files on disk', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const testBytes = Buffer.from('test-bytes-purely-in-memory');

      // Record files in temp and app before
      const appRootFilesBefore = fs.readdirSync(process.cwd());

      const classification = await mockProvider.classify({ bytes: testBytes, mime: 'image/jpeg' });
      expect(classification).toBeDefined();

      const appRootFilesAfter = fs.readdirSync(process.cwd());
      expect(appRootFilesAfter).toEqual(appRootFilesBefore);
    });
  });
});
