import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

export class CacheService {
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!redisClient.isReady()) return null;

    try {
      const client = redisClient.getClient();
      const value = await client?.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  /**
   * Set cached value with TTL (in seconds)
   */
  static async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      const client = redisClient.getClient();
      await client?.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  /**
   * Delete cached value(s)
   */
  static async del(key: string | string[]): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      const client = redisClient.getClient();
      const keys = Array.isArray(key) ? key : [key];
      await client?.del(keys);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  /**
   * Delete all keys matching pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    if (!redisClient.isReady()) return;

    try {
      const client = redisClient.getClient();
      const keys = [];
      for await (const key of client?.scanIterator({ MATCH: pattern }) || []) {
        keys.push(key);
      }
      if (keys.length > 0) {
        await client?.del(keys);
      }
    } catch (error) {
      logger.error('Cache pattern delete error:', { pattern, error });
    }
  }

  /**
   * Cache wrapper - get from cache or execute function
   */
  static async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }
}

export default CacheService;
