import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * AI 配置实体（单例模式：仅一条记录，id 固定为常量）
 * 管理端可通过 /ai-config 接口读取和更新 AI 服务配置
 */
@Entity('ai_config')
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ length: 50, default: 'openai' })
  provider: string;

  @Column({ length: 500, default: '' })
  apiKey: string;

  @Column({ length: 100, default: 'gpt-4o-mini' })
  model: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature: number;

  @Column({ type: 'int', default: 2048 })
  maxTokens: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
