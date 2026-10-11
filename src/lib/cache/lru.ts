import crypto from 'crypto';
import { Classification } from '../schemas/classification';

export interface CacheEntry {
  classification: Classification;
  expiresAt: number;
}

export class ClassificationLRUCache {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(maxEntries = 200, ttlMs = 24 * 60 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  public static computeKey(bytes: Buffer, version: string): string {
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    return `${hash}:${version}`;
  }

  public get(key: string): Classification | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.classification;
  }

  public set(key: string, classification: Classification): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      // Evict oldest (first item in Map iteration)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      classification,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}

// Global singleton instance for in-memory caching
export const globalClassificationCache = new ClassificationLRUCache();
