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

export enum ApprovalType {
  LEAVE = 'leave',
  EXPENSE = 'expense',
  PROCUREMENT = 'procurement',
  BUSINESS_TRIP = 'business_trip',
  OTHER = 'other',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ApprovalUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'applicant_id' })
  applicantId: string;

  @Column({
    type: 'enum',
    enum: ApprovalType,
    default: ApprovalType.OTHER,
  })
  type: ApprovalType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount: number;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({
    type: 'enum',
    enum: ApprovalUrgency,
    default: ApprovalUrgency.MEDIUM,
  })
  urgency: ApprovalUrgency;

  @Column({ length: 255, nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;
}
