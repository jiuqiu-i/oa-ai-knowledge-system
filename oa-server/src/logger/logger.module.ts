import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './winston.factory';

/**
 * Logger 模块 - 集中管理 Winston 日志实例
 * 在 main.ts 中通过 app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER)) 接入
 */
@Module({
  imports: [WinstonModule.forRoot(winstonConfig)],
  exports: [WinstonModule],
})
export class LoggerModule {}
