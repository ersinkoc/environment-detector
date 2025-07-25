import { Cache } from '../../../src/core/cache';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = Cache.getInstance();
    cache.clear();
    cache.enable();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const cache1 = Cache.getInstance();
      const cache2 = Cache.getInstance();
      expect(cache1).toBe(cache2);
    });
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('test', 'value');
      expect(cache.has('test')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('test', 'value');
      expect(cache.delete('test')).toBe(true);
      expect(cache.has('test')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      cache.clear();
      expect(cache.has('test1')).toBe(false);
      expect(cache.has('test2')).toBe(false);
    });
  });

  describe('timeout functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should expire entries after timeout', () => {
      cache.set('test', 'value', 1000);
      expect(cache.get('test')).toBe('value');
      
      jest.advanceTimersByTime(1001);
      expect(cache.get('test')).toBeUndefined();
    });

    it('should not expire entries before timeout', () => {
      cache.set('test', 'value', 1000);
      jest.advanceTimersByTime(999);
      expect(cache.get('test')).toBe('value');
    });

    it('should clean up expired entries on access', () => {
      cache.set('test', 'value', 1000);
      jest.advanceTimersByTime(1001);
      
      expect(cache.size()).toBe(1);
      cache.get('test'); // Should trigger cleanup
      expect(cache.size()).toBe(0);
    });

    it('should clean up expired entries on has check', () => {
      cache.set('test', 'value', 1000);
      expect(cache.has('test')).toBe(true);
      
      jest.advanceTimersByTime(1001);
      expect(cache.has('test')).toBe(false);
      
      expect(cache.size()).toBe(0);
    });
  });

  describe('enable/disable functionality', () => {
    it('should not store when disabled', () => {
      cache.disable();
      cache.set('test', 'value');
      expect(cache.get('test')).toBeUndefined();
    });

    it('should not retrieve when disabled', () => {
      cache.set('test', 'value');
      cache.disable();
      expect(cache.get('test')).toBeUndefined();
    });

    it('should clear cache when disabled', () => {
      cache.set('test', 'value');
      expect(cache.size()).toBe(1);
      cache.disable();
      expect(cache.size()).toBe(0);
    });

    it('should work normally when re-enabled', () => {
      cache.disable();
      cache.enable();
      cache.set('test', 'value');
      expect(cache.get('test')).toBe('value');
    });
  });

  describe('utility methods', () => {
    it('should return correct size', () => {
      expect(cache.size()).toBe(0);
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      expect(cache.size()).toBe(2);
    });

    it('should return all keys', () => {
      cache.set('test1', 'value1');
      cache.set('test2', 'value2');
      const keys = cache.keys();
      expect(keys).toContain('test1');
      expect(keys).toContain('test2');
      expect(keys).toHaveLength(2);
    });

    it('should report enabled status', () => {
      expect(cache.isEnabled()).toBe(true);
      cache.disable();
      expect(cache.isEnabled()).toBe(false);
      cache.enable();
      expect(cache.isEnabled()).toBe(true);
    });
  });
});