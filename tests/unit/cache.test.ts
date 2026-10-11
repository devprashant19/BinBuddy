import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClassificationLRUCache } from '@/lib/cache/lru';
import { Classification } from '@/lib/schemas/classification';

const sampleClassification: Classification = {
  itemType: 'bottle',
  material: 'plastic',
  condition: 'clean',
  visibleResinCode: '1',
  confidence: 0.95,
  shortDescription: 'Clear plastic bottle',
};

describe('ClassificationLRUCache', () => {
  let cache: ClassificationLRUCache;
  const dummyBuffer = Buffer.from('test-image-content-bytes');

  beforeEach(() => {
    cache = new ClassificationLRUCache(3, 1000); // max 3, 1000ms TTL
  });

  it('computes sha256 hash and includes classifier version in key', () => {
    const key1 = ClassificationLRUCache.computeKey(dummyBuffer, 'v1.0.0');
    const key2 = ClassificationLRUCache.computeKey(dummyBuffer, 'v1.0.1');
    const key1Dup = ClassificationLRUCache.computeKey(dummyBuffer, 'v1.0.0');

    expect(key1).toContain(':v1.0.0');
    expect(key2).toContain(':v1.0.1');
    expect(key1).toBe(key1Dup);
    expect(key1).not.toBe(key2);
  });

  it('returns null on cache miss and stores entry on set', () => {
    const key = ClassificationLRUCache.computeKey(dummyBuffer, 'v1.0.0');
    expect(cache.get(key)).toBeNull();
    expect(cache.has(key)).toBe(false);

    cache.set(key, sampleClassification);
    expect(cache.has(key)).toBe(true);

    const retrieved = cache.get(key);
    expect(retrieved).toEqual(sampleClassification);
  });

  it('verifies cache never stores raw image bytes', () => {
    const key = ClassificationLRUCache.computeKey(dummyBuffer, 'v1.0.0');
    cache.set(key, sampleClassification);

    const rawCacheMap = (cache as any).cache as Map<string, any>;
    const entry = rawCacheMap.get(key);
    expect(entry).toBeDefined();
    expect(entry.classification).toBeDefined();
    expect(entry.bytes).toBeUndefined();
    expect(entry.buffer).toBeUndefined();
  });

  it('evicts least recently used item when maxEntries is exceeded', () => {
    const key1 = 'item1:v1';
    const key2 = 'item2:v1';
    const key3 = 'item3:v1';
    const key4 = 'item4:v1';

    cache.set(key1, { ...sampleClassification, shortDescription: 'Item 1' });
    cache.set(key2, { ...sampleClassification, shortDescription: 'Item 2' });
    cache.set(key3, { ...sampleClassification, shortDescription: 'Item 3' });

    expect(cache.size).toBe(3);

    // Access key1 so key2 becomes least recently used
    cache.get(key1);

    // Insert key4, which should evict key2
    cache.set(key4, { ...sampleClassification, shortDescription: 'Item 4' });

    expect(cache.size).toBe(3);
    expect(cache.get(key1)).not.toBeNull();
    expect(cache.get(key2)).toBeNull(); // Evicted!
    expect(cache.get(key3)).not.toBeNull();
    expect(cache.get(key4)).not.toBeNull();
  });

  it('expires entries after TTL', () => {
    vi.useFakeTimers();
    try {
      const key = 'item-ttl:v1';
      cache.set(key, sampleClassification);
      expect(cache.get(key)).not.toBeNull();

      // Advance time by 1500ms (> 1000ms TTL)
      vi.advanceTimersByTime(1500);

      expect(cache.get(key)).toBeNull();
      expect(cache.has(key)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears all entries on clear()', () => {
    cache.set('k1', sampleClassification);
    cache.set('k2', sampleClassification);
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('k1')).toBeNull();
  });
});
