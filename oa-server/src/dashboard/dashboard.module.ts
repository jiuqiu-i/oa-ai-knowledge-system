import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../entities/user.entity';
import { Approval } from '../entities/approval.entity';
import { KnowledgeBase } from '../entities/kb.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Approval, KnowledgeBase])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
