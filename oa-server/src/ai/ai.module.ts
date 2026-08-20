import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AgentService } from './agent.service';
import { AiController } from './ai.controller';
import { AiConversation } from '../entities/ai-conversation.entity';
import { User } from '../entities/user.entity';
import { Approval } from '../entities/approval.entity';
import { KnowledgeBase } from '../entities/kb.entity';
import { AiToolsService } from './tools/ai-tools.service';

@Module({
  // AiToolsService 直接访问 User/Approval/KnowledgeBase 仓储，
  // 避免与 DashboardModule/ApprovalsModule 产生循环依赖。
  imports: [TypeOrmModule.forFeature([AiConversation, User, Approval, KnowledgeBase])],
  controllers: [AiController],
  providers: [AiService, AgentService, AiToolsService],
  exports: [AiService, AgentService],
})
export class AiModule implements OnModuleInit {
  constructor(
    private readonly agentService: AgentService,
    private readonly aiToolsService: AiToolsService,
  ) {}

  onModuleInit() {
    // 注入工具服务到 Agent，使 Agent 能调用后端工具函数
    this.agentService.setToolsService(this.aiToolsService);
  }
}
