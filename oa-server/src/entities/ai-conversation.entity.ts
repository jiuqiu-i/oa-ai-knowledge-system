import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  /** 思考步骤列表（工具调用轨迹），仅 assistant 消息有 */
  thinkingSteps?: string[];
}

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 255, default: '新会话' })
  title: string;

  @Column({ type: 'longtext' })
  messages: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.aiConversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  getMessages(): AiMessage[] {
    try {
      return JSON.parse(this.messages || '[]');
    } catch {
      return [];
    }
  }

  setMessages(messages: AiMessage[]) {
    this.messages = JSON.stringify(messages);
  }
}
