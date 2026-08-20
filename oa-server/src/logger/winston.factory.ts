import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { utilities } from 'nest-winston';

/**
 * Winston 日志配置工厂
 * - 控制台彩色输出（开发友好）
 * - 按日轮转文件：app-YYYY-MM-DD.log（全量）、error-YYYY-MM-DD.log（仅 error）
 * - 日志目录由环境变量 LOG_DIR 注入（容器内 /app/logs，本地默认 ./logs）
 *
 * 轮转策略采用 winston-daily-rotate-file：按天切分 + 保留 14 天 + 单文件 20MB
 * 未安装 winston-daily-rotate-file 时降级为 Console-only，避免启动失败
 */
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.ms(),
        utilities.format.nestLike('OA-Server', {
          prettyPrint: true,
          colors: process.env.NODE_ENV !== 'production',
        }),
      ),
    }),
    ...buildFileTransports(),
  ],
};

function buildFileTransports(): winston.transport[] {
  const logDir = process.env.LOG_DIR || './logs';
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const DailyRotateFile = require('winston-daily-rotate-file');
    return [
      new DailyRotateFile({
        dirname: logDir,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.json(),
        ),
      }),
      new DailyRotateFile({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.json(),
        ),
      }),
    ];
  } catch {
    // winston-daily-rotate-file 未安装：降级为仅控制台输出
    // eslint-disable-next-line no-console
    console.warn('[logger] winston-daily-rotate-file 未安装，文件轮转降级为关闭');
    return [];
  }
}
