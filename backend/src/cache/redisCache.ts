import Redis from 'ioredis';
import { env } from '../config/env.js';

interface ICacheManager {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  isRedisConnected(): boolean;
}

class InMemoryCache implements ICacheManager {
  private store = new Map<string, { val: any; expires?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.val as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expires = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { val: value, expires });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  isRedisConnected(): boolean {
    return false;
  }
}

class RedisCacheManager implements ICacheManager {
  private client: Redis | null = null;
  private inMemoryFallback = new InMemoryCache();
  private isConnected = false;

  constructor() {
    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // don't hang if redis is not running locally
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        console.log('[Cache] Connected to Redis successfully');
      }).catch(() => {
        this.isConnected = false;
        console.log('[Cache] Redis unavailable. Using high-performance in-memory cache.');
      });

      this.client.on('error', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return this.inMemoryFallback.get<T>(key);
    }
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return this.inMemoryFallback.get<T>(key);
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    if (!this.isConnected || !this.client) {
      return this.inMemoryFallback.set(key, value, ttlSeconds);
    }
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      return this.inMemoryFallback.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return this.inMemoryFallback.del(key);
    }
    try {
      await this.client.del(key);
    } catch {
      return this.inMemoryFallback.del(key);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return this.inMemoryFallback.delPattern(pattern);
    }
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      return this.inMemoryFallback.delPattern(pattern);
    }
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}

export const cache = new RedisCacheManager();
