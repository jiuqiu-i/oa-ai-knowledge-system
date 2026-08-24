import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 全文检索索引：title + content，使用 ngram 解析器以支持中文分词
 * 注意：synchronize 不会自动创建带 parser 的 FULLTEXT 索引，
 * 生产部署需通过迁移脚本执行：
 *   CREATE FULLTEXT INDEX idx_kb_fulltext ON knowledge_base (title, content) WITH PARSER ngram;
 * 检索逻辑在 service 中提供 LIKE 降级，索引缺失不影响可用性。
 */
@Entity('knowledge_base')
@Index('idx_kb_fulltext', ['title', 'content'], { fulltext: true, parser: 'ngram' })
@Index('idx_kb_category', ['category'])
@Index('idx_kb_views', ['views'])
@Index('idx_kb_author', ['authorId'])
export class KnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 100 })
  category: string;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ length: 500, nullable: true })
  attachment: string | null;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ default: 0 })
  views: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.knowledgeBaseDocs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
