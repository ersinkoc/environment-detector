import type { CacheEntry } from '@/types';
import { DEFAULT_CACHE_TIMEOUT } from './constants';

export class Cache {
  private static instance: Cache;
  private store = new Map<string, CacheEntry>();
  private enabled = true;

  private constructor() {}

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public get<T>(key: string): T | undefined {
    if (!this.enabled) {
      return undefined;
    }

    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.timeout) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, timeout = DEFAULT_CACHE_TIMEOUT): void {
    if (!this.enabled) {
      return;
    }

    this.store.set(key, {
      value,
      timestamp: Date.now(),
      timeout,
    });
  }

  public has(key: string): boolean {
    if (!this.enabled) {
      return false;
    }

    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.timeout) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
    this.clear();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public size(): number {
    return this.store.size;
  }

  public keys(): string[] {
    return Array.from(this.store.keys());
  }
}