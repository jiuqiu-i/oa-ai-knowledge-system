import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password');
    const db = this.configService.get<number>('redis.db') || 0;

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * Cache-Aside 模式封装：先读缓存，未命中则执行 loader 取数并回填；
   * 命中时直接返回缓存，避免穿透到数据库。loader 抛错时不上写脏缓存。
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // 缓存值损坏，回退到 loader 重建
        this.logger.warn(`缓存值解析失败，重建 key=${key}`);
      }
    }
    const fresh = await loader();
    // 不缓存 null/undefined，避免缓存穿透误判
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, JSON.stringify(fresh), ttlSeconds);
    }
    return fresh;
  }

  /**
   * 失效自动更新：删除缓存 key（写操作后调用，保证后续读触发重建）
   */
  async invalidate(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length === 0) return;
    await this.client.del(keys);
    this.logger.log(`缓存失效: ${keys.join(', ')}`);
  }

  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.get(`blacklist:${token}`);
    return result === '1';
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
