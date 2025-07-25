import { BaseDetector, DetectorRegistry } from '../../../src/core/detector';
import { Cache } from '../../../src/core/cache';
import type { DetectorOptions } from '../../../src/types';

// Mock the Cache module
jest.mock('../../../src/core/cache');

// Create a concrete implementation for testing
class TestDetector extends BaseDetector<string> {
  public readonly name = 'test';
  
  protected performDetection(): string {
    return 'test-result';
  }
}

class AsyncTestDetector extends BaseDetector<string> {
  public readonly name = 'async-test';
  
  constructor(options?: DetectorOptions) {
    super({ ...options, async: true });
  }
  
  protected performDetection(): string {
    throw new Error('Should not be called for async detector');
  }
  
  protected override async performAsyncDetection(): Promise<string> {
    return 'async-test-result';
  }
}

describe('BaseDetector', () => {
  let mockCache: jest.Mocked<Cache>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      has: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true),
      enable: jest.fn(),
      disable: jest.fn(),
    } as any;
    
    (Cache.getInstance as jest.Mock).mockReturnValue(mockCache);
  });

  describe('constructor', () => {
    it('should set default options', () => {
      const detector = new TestDetector();
      expect(detector['options']).toEqual({
        cache: true,
        cacheTimeout: 60000,
        async: false,
      });
    });

    it('should merge custom options with defaults', () => {
      const detector = new TestDetector({
        cache: false,
        cacheTimeout: 30000,
      });
      expect(detector['options']).toEqual({
        cache: false,
        cacheTimeout: 30000,
        async: false,
      });
    });
  });

  describe('detect', () => {
    it('should return sync result for sync detector', () => {
      const detector = new TestDetector();
      const result = detector.detect();
      expect(result).toBe('test-result');
    });

    it('should return promise for async detector', async () => {
      const detector = new AsyncTestDetector();
      const result = await detector.detect();
      expect(result).toBe('async-test-result');
    });
  });

  describe('detectSync', () => {
    it('should return cached result when available and caching enabled', () => {
      const detector = new TestDetector({ cache: true });
      mockCache.get.mockReturnValue('cached-result');
      
      const result = detector.detect();
      
      expect(mockCache.get).toHaveBeenCalledWith('detector:test');
      expect(result).toBe('cached-result');
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should perform detection and cache result when no cache available', () => {
      const detector = new TestDetector({ cache: true });
      mockCache.get.mockReturnValue(undefined);
      
      const result = detector.detect();
      
      expect(mockCache.get).toHaveBeenCalledWith('detector:test');
      expect(result).toBe('test-result');
      expect(mockCache.set).toHaveBeenCalledWith('detector:test', 'test-result', 60000);
    });

    it('should not use cache when caching disabled', () => {
      const detector = new TestDetector({ cache: false });
      
      const result = detector.detect();
      
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(result).toBe('test-result');
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should use custom cache timeout', () => {
      const detector = new TestDetector({ cache: true, cacheTimeout: 5000 });
      mockCache.get.mockReturnValue(undefined);
      
      detector.detect();
      
      expect(mockCache.set).toHaveBeenCalledWith('detector:test', 'test-result', 5000);
    });
  });

  describe('detectAsync', () => {
    it('should return cached result when available', async () => {
      const detector = new AsyncTestDetector({ cache: true });
      mockCache.get.mockReturnValue('cached-async-result');
      
      const result = await detector.detect();
      
      expect(mockCache.get).toHaveBeenCalledWith('detector:async-test');
      expect(result).toBe('cached-async-result');
    });

    it('should perform async detection and cache result', async () => {
      const detector = new AsyncTestDetector({ cache: true });
      mockCache.get.mockReturnValue(undefined);
      
      const result = await detector.detect();
      
      expect(result).toBe('async-test-result');
      expect(mockCache.set).toHaveBeenCalledWith('detector:async-test', 'async-test-result', 60000);
    });

    it('should not use cache when disabled', async () => {
      const detector = new AsyncTestDetector({ cache: false });
      
      const result = await detector.detect();
      
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(result).toBe('async-test-result');
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should use default async implementation that calls performDetection', async () => {
      // Test the default performAsyncDetection implementation
      const detector = new TestDetector({ async: true });
      
      const result = await detector.detect();
      
      expect(result).toBe('test-result');
    });
  });

  describe('reset', () => {
    it('should delete cache entry', () => {
      const detector = new TestDetector();
      
      detector.reset();
      
      expect(mockCache.delete).toHaveBeenCalledWith('detector:test');
    });
  });

  describe('getCacheKey', () => {
    it('should return correct cache key', () => {
      const detector = new TestDetector();
      expect(detector['getCacheKey']()).toBe('detector:test');
    });
  });
});

describe('DetectorRegistry', () => {
  let registry: DetectorRegistry;
  
  beforeEach(() => {
    // Clear the singleton instance
    (DetectorRegistry as any).instance = undefined;
    registry = DetectorRegistry.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DetectorRegistry.getInstance();
      const instance2 = DetectorRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a detector', () => {
      const detector = new TestDetector();
      
      registry.register(detector);
      
      expect(registry.has('test')).toBe(true);
      expect(registry.get('test')).toBe(detector);
    });

    it('should overwrite existing detector with same name', () => {
      const detector1 = new TestDetector();
      const detector2 = new TestDetector();
      
      registry.register(detector1);
      registry.register(detector2);
      
      expect(registry.get('test')).toBe(detector2);
    });
  });

  describe('unregister', () => {
    it('should remove registered detector', () => {
      const detector = new TestDetector();
      registry.register(detector);
      
      registry.unregister('test');
      
      expect(registry.has('test')).toBe(false);
      expect(registry.get('test')).toBeUndefined();
    });

    it('should handle unregistering non-existent detector', () => {
      expect(() => registry.unregister('non-existent')).not.toThrow();
    });
  });

  describe('get', () => {
    it('should return registered detector', () => {
      const detector = new TestDetector();
      registry.register(detector);
      
      expect(registry.get('test')).toBe(detector);
    });

    it('should return undefined for non-existent detector', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered detectors', () => {
      const detector1 = new TestDetector();
      const detector2 = new AsyncTestDetector();
      
      registry.register(detector1);
      registry.register(detector2);
      
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(detector1);
      expect(all).toContain(detector2);
    });

    it('should return empty array when no detectors registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('has', () => {
    it('should return true for registered detector', () => {
      const detector = new TestDetector();
      registry.register(detector);
      
      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent detector', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all registered detectors', () => {
      const detector1 = new TestDetector();
      const detector2 = new AsyncTestDetector();
      
      registry.register(detector1);
      registry.register(detector2);
      
      registry.clear();
      
      expect(registry.getAll()).toEqual([]);
      expect(registry.has('test')).toBe(false);
      expect(registry.has('async-test')).toBe(false);
    });
  });
});