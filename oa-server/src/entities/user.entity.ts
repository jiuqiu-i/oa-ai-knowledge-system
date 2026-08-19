import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Approval } from './approval.entity';
import { KnowledgeBase } from './kb.entity';
import { AiConversation } from './ai-conversation.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ length: 100, default: '' })
  dept: string;

  @Column({ name: 'avatar_color', length: 20, default: '#3b82f6' })
  avatarColor: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Approval, (approval) => approval.applicant)
  approvals: Approval[];

  @OneToMany(() => KnowledgeBase, (kb) => kb.author)
  knowledgeBaseDocs: KnowledgeBase[];

  @OneToMany(() => AiConversation, (conversation) => conversation.user)
  aiConversations: AiConversation[];
}
