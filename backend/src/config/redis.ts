import { createClient } from 'redis';
import { config } from './config';
import { logger } from './logger';

class RedisClient {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;
  private connectionAttempted = false;

  async connect(): Promise<void> {
    // Skip if Redis is disabled or already attempted
    if (this.connectionAttempted) {
      return;
    }
    this.connectionAttempted = true;

    // Check if Redis is configured
    if (!config.redis?.host) {
      logger.warn('Redis not configured - running without cache');
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          connectTimeout: 3000,
          reconnectStrategy: false,
        },
        password: config.redis.password || undefined,
        database: config.redis.db,
      });

      // Register error handler to prevent crashes
      this.client.on('error', () => {});
      this.client.on('connect', () => logger.info('Redis connected'));
      this.client.on('disconnect', () => {
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info('Redis client initialized successfully');
    } catch {
      logger.warn('Redis unavailable - running without cache (degraded mode)');
      this.isConnected = false;
      this.client = null;
    }
  }

  getClient() {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }
}

export const redisClient = new RedisClient();
export default redisClient;
