import type { Detector, DetectorOptions } from '@/types';
import { Cache } from './cache';

export abstract class BaseDetector<T = unknown> implements Detector<T> {
  public abstract readonly name: string;
  protected cache = Cache.getInstance();
  protected options: DetectorOptions;

  constructor(options: DetectorOptions = {}) {
    this.options = {
      cache: true,
      cacheTimeout: 60000,
      async: false,
      ...options,
    };
  }

  public detect(): T | Promise<T> {
    if (this.options.async) {
      return this.detectAsync();
    }
    return this.detectSync();
  }

  public reset(): void {
    this.cache.delete(this.getCacheKey());
  }

  protected detectSync(): T {
    const cacheKey = this.getCacheKey();
    
    if (this.options.cache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const result = this.performDetection();
    
    if (this.options.cache) {
      this.cache.set(cacheKey, result, this.options.cacheTimeout);
    }

    return result;
  }

  protected async detectAsync(): Promise<T> {
    const cacheKey = this.getCacheKey();
    
    if (this.options.cache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const result = await this.performAsyncDetection();
    
    if (this.options.cache) {
      this.cache.set(cacheKey, result, this.options.cacheTimeout);
    }

    return result;
  }

  protected abstract performDetection(): T;
  
  protected async performAsyncDetection(): Promise<T> {
    return this.performDetection();
  }

  protected getCacheKey(): string {
    return `detector:${this.name}`;
  }
}

export class DetectorRegistry {
  private static instance: DetectorRegistry;
  private detectors = new Map<string, Detector>();

  private constructor() {}

  public static getInstance(): DetectorRegistry {
    if (!DetectorRegistry.instance) {
      DetectorRegistry.instance = new DetectorRegistry();
    }
    return DetectorRegistry.instance;
  }

  public register(detector: Detector): void {
    this.detectors.set(detector.name, detector);
  }

  public unregister(name: string): void {
    this.detectors.delete(name);
  }

  public get(name: string): Detector | undefined {
    return this.detectors.get(name);
  }

  public getAll(): Detector[] {
    return Array.from(this.detectors.values());
  }

  public has(name: string): boolean {
    return this.detectors.has(name);
  }

  public clear(): void {
    this.detectors.clear();
  }
}