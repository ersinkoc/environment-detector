import { Cache } from '../../src/core/cache';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = Cache.getInstance();
    cache.clear();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should report size correctly', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('TTL functionality', () => {
    it('should expire values after TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use default TTL when not specified', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('enable/disable functionality', () => {
    it('should start enabled by default', () => {
      expect(cache.isEnabled()).toBe(true);
    });

    it('should disable caching when disabled', () => {
      cache.disable();
      expect(cache.isEnabled()).toBe(false);
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear cache when disabled', () => {
      cache.set('key1', 'value1');
      cache.disable();
      expect(cache.size()).toBe(0);
    });

    it('should re-enable caching', () => {
      cache.disable();
      cache.enable();
      expect(cache.isEnabled()).toBe(true);
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      expect(cache.isEnabled()).toBe(true);
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('disable functionality', () => {
    it('should work when disabled', () => {
      cache.disable();
      expect(cache.isEnabled()).toBe(false);
      cache.enable();
      expect(cache.isEnabled()).toBe(true);
    });
  });
});