import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getEnv } from '../config/env';

export class AudioDiskCache {
  private readonly cacheDir: string;

  constructor(customDir?: string) {
    const env = getEnv();
    this.cacheDir = customDir || path.resolve(process.cwd(), env.AUDIO_CACHE_DIR);
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  public computeKey(
    text: string,
    voiceId: string,
    modelId: string,
    rulesetVersion: string
  ): string {
    const raw = `${text}:${voiceId}:${modelId}:${rulesetVersion}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public get(key: string): Buffer | null {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const buffer = fs.readFileSync(filePath);

      // Validate audio file integrity:
      // Minimum size check (corrupted/truncated files) and MP3 magic signature
      // MP3 files begin either with ID3 tag ('ID3' / 0x49 0x44 0x33) or MP3 sync frame (0xFF 0xFB/0xF3/0xF2)
      if (buffer.length < 100) {
        // Corrupted / empty file: remove and return null so it regenerates
        fs.unlinkSync(filePath);
        return null;
      }

      const isId3 = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33;
      const isSyncFrame = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;

      if (!isId3 && !isSyncFrame) {
        // Corrupted data: remove and return null
        fs.unlinkSync(filePath);
        return null;
      }

      return buffer;
    } catch {
      return null;
    }
  }

  public set(key: string, buffer: Buffer): void {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
    } catch (err) {
      console.error('[audio-cache] Failed to write cache file:', err);
    }
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const globalAudioCache = new AudioDiskCache();
