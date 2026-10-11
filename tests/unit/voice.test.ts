import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getNarrationForRule } from '@/lib/voice/narration';
import { AudioDiskCache } from '@/lib/voice/audio-cache';
import { ElevenLabsService } from '@/lib/voice/elevenlabs';

const mockConvert = vi.fn();

vi.mock('elevenlabs', () => {
  return {
    ElevenLabsClient: vi.fn().mockImplementation(() => {
      return {
        textToSpeech: {
          convert: mockConvert,
        },
      };
    }),
  };
});

describe('Phase 5: Voice Unit Suite', () => {
  const testCacheDir = path.resolve(process.cwd(), '.cache/test-audio');

  beforeEach(() => {
    vi.clearAllMocks();
    if (!fs.existsSync(testCacheDir)) {
      fs.mkdirSync(testCacheDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('Narration Resolution (src/lib/voice/narration.ts)', () => {
    it('successfully resolves official narration for valid ruleId and matching version', () => {
      const result = getNarrationForRule('metal-can-clean', '1.0.0');
      expect(result).not.toBeNull();
      expect(result?.ruleId).toBe('metal-can-clean');
      expect(result?.narration).toBe('Clean metal cans go in the green recycling cart.');
      expect(result?.destinationId).toBe('recycling_cart');
      expect(result?.rulesetVersion).toBe('1.0.0');
    });

    it('returns null for nonexistent ruleId', () => {
      const result = getNarrationForRule('non-existent-rule-123', '1.0.0');
      expect(result).toBeNull();
    });

    it('returns null when ruleset version does not match', () => {
      const result = getNarrationForRule('metal-can-clean', '9.9.9');
      expect(result).toBeNull();
    });

    it('returns null for empty or missing arguments', () => {
      expect(getNarrationForRule('', '1.0.0')).toBeNull();
      expect(getNarrationForRule('metal-can-clean', '')).toBeNull();
    });
  });

  describe('Audio Disk Cache (src/lib/voice/audio-cache.ts)', () => {
    it('computes stable sha256 cache key across identical parameters', () => {
      const cache = new AudioDiskCache(testCacheDir);
      const k1 = cache.computeKey('Hello world', 'voice1', 'model1', '1.0.0');
      const k2 = cache.computeKey('Hello world', 'voice1', 'model1', '1.0.0');
      const k3 = cache.computeKey('Hello world', 'voice2', 'model1', '1.0.0');

      expect(k1).toBe(k2);
      expect(k1).not.toBe(k3);
      expect(k1).toHaveLength(64); // sha256 hex length
    });

    it('saves and retrieves valid MP3 audio buffer from disk cache', () => {
      const cache = new AudioDiskCache(testCacheDir);
      const key = 'test-valid-mp3';

      // Create a dummy valid MP3 buffer (ID3 header + 120 bytes)
      const validMp3 = Buffer.alloc(150);
      validMp3[0] = 0x49; // 'I'
      validMp3[1] = 0x44; // 'D'
      validMp3[2] = 0x33; // '3'

      cache.set(key, validMp3);
      expect(cache.has(key)).toBe(true);

      const retrieved = cache.get(key);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.length).toBe(150);
    });

    it('self-heals: automatically purges corrupted or undersized cache file and returns null', () => {
      const cache = new AudioDiskCache(testCacheDir);
      const key = 'test-corrupt-file';
      const filePath = path.join(testCacheDir, `${key}.mp3`);

      // Write corrupted 10-byte file
      fs.writeFileSync(filePath, Buffer.from('corrupted'));

      expect(fs.existsSync(filePath)).toBe(true);
      const result = cache.get(key);

      // Should return null AND delete the corrupted file
      expect(result).toBeNull();
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });

  describe('ElevenLabs Service (src/lib/voice/elevenlabs.ts)', () => {
    it('generates speech buffer when ElevenLabs returns audio stream', async () => {
      const service = new ElevenLabsService('dummy-key', 'voice-1', 'model-1');
      const fakeAudioChunk = Buffer.from('fake-mp3-stream-data');

      async function* fakeStream() {
        yield fakeAudioChunk;
      }

      mockConvert.mockResolvedValueOnce(fakeStream());

      const buffer = await service.generateSpeech({ text: 'Test narration' });
      expect(buffer).toEqual(fakeAudioChunk);
      expect(mockConvert).toHaveBeenCalledTimes(1);
    });

    it('throws VOICE_UNAVAILABLE if ElevenLabs SDK throws an error', async () => {
      const service = new ElevenLabsService('dummy-key', 'voice-1', 'model-1');
      mockConvert.mockRejectedValueOnce(new Error('Rate limit or quota exceeded'));

      await expect(
        service.generateSpeech({ text: 'Test failure' })
      ).rejects.toThrow(/VOICE_UNAVAILABLE/);
    });
  });
});
