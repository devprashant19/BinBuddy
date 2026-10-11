import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getEnv } from '../config/env';

export interface SeedResult {
  copied: number;
  skipped: number;
  total: number;
}

/**
 * Copies any audio seed files missing from target cache directory without overwriting.
 */
export function seedAudioCache(
  cacheDir?: string,
  seedDir?: string
): SeedResult {
  const env = getEnv();
  const targetDir = cacheDir || path.resolve(process.cwd(), env.AUDIO_CACHE_DIR);
  const sourceDir = seedDir || path.resolve(process.cwd(), 'data/audio-seed');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (!fs.existsSync(sourceDir)) {
    return { copied: 0, skipped: 0, total: 0 };
  }

  let copied = 0;
  let skipped = 0;
  const seedFiles = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.mp3'));

  for (const file of seedFiles) {
    const targetPath = path.join(targetDir, file);
    const sourcePath = path.join(sourceDir, file);

    // Copy any seed file missing from AUDIO_CACHE_DIR into it, without overwriting
    if (!fs.existsSync(targetPath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        copied++;
      } catch (err) {
        console.error(`[audio-cache] Failed to copy seed file ${file}:`, err);
      }
    } else {
      skipped++;
    }
  }

  return { copied, skipped, total: seedFiles.length };
}

export class AudioDiskCache {
  private readonly cacheDir: string;
  private readonly seedDir: string;

  constructor(customDir?: string, customSeedDir?: string) {
    const env = getEnv();
    this.cacheDir = customDir || path.resolve(process.cwd(), env.AUDIO_CACHE_DIR);
    this.seedDir = customSeedDir || path.resolve(process.cwd(), 'data/audio-seed');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    // Seed any missing files on instantiation without overwriting
    seedAudioCache(this.cacheDir, this.seedDir);
  }

  public getCacheDir(): string {
    return this.cacheDir;
  }

  public getSeedDir(): string {
    return this.seedDir;
  }

  public seedMissing(): SeedResult {
    return seedAudioCache(this.cacheDir, this.seedDir);
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
      // If missing from cacheDir, self-heal by checking seedDir and copying without overwriting
      const seedPath = path.join(this.seedDir, `${key}.mp3`);
      if (fs.existsSync(seedPath)) {
        try {
          if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
          }
          fs.copyFileSync(seedPath, filePath);
        } catch {
          return fs.readFileSync(seedPath);
        }
      } else {
        return null;
      }
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
