import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  uptime: number;
  dependencies: {
    mysql: { status: 'up' | 'down'; latencyMs?: number; error?: string };
    redis: { status: 'up' | 'down'; latencyMs?: number; error?: string };
  };
}

/**
 * 健康检查服务 - 供 docker-compose healthcheck / Nginx 探针 / 自愈策略使用
 * 探测 MySQL、Redis 依赖可用性，并返回进程运行时信息
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startedAt = Date.now();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async check(): Promise<HealthStatus> {
    const [mysql, redis] = await Promise.all([this.checkMysql(), this.checkRedis()]);

    const status: HealthStatus = {
      status: mysql.status === 'up' && redis.status === 'up' ? 'ok' : 'degraded',
      service: 'oa-server',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      dependencies: { mysql, redis },
    };

    if (status.status === 'degraded') {
      this.logger.warn(`健康检查降级: mysql=${mysql.status} redis=${redis.status}`);
    }

    return status;
  }

  private async checkMysql() {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' as const, latencyMs: Date.now() - start };
    } catch (e) {
      return { status: 'down' as const, error: (e as Error).message };
    }
  }

  private async checkRedis() {
    const start = Date.now();
    try {
      const pong = await this.redisService.ping();
      return { status: pong === 'PONG' ? ('up' as const) : ('down' as const), latencyMs: Date.now() - start };
    } catch (e) {
      return { status: 'down' as const, error: (e as Error).message };
    }
  }
}
