import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AiService } from './ai.service';
import { AgentService } from './agent.service';
import { ChatDto } from './dto/chat.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI 助手')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private agentService: AgentService,
  ) {}

  // ---------- 会话管理 ----------

  @Get('conversations')
  @ApiOperation({ summary: '会话列表' })
  getConversations(@CurrentUser('id') userId: string) {
    return this.aiService.getConversations(userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: '新建会话' })
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.aiService.createConversation(userId, dto.title);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: '会话详情' })
  getConversation(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.aiService.getConversation(userId, id);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: '删除会话' })
  deleteConversation(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.aiService.deleteConversation(userId, id);
  }

  // ---------- 普通对话（基于 LangChain ChatOpenAI）----------

  @Post('chat')
  @ApiOperation({ summary: 'AI 对话（非流式）' })
  chat(@CurrentUser('id') userId: string, @Body() dto: ChatDto) {
    return this.aiService.chat(userId, dto);
  }

  @Sse('chat/stream')
  @ApiOperation({ summary: 'AI 对话（流式 SSE）' })
  chatStream(@CurrentUser('id') userId: string, @Query() dto: ChatDto): Observable<string> {
    return this.aiService.chatStream(userId, dto);
  }

  // ---------- Agent 智能助手（工具调用编排）----------

  @Post('agent')
  @ApiOperation({ summary: 'Agent 智能对话（非流式，自动调用知识库/审批/报表工具）' })
  agentChat(@CurrentUser('id') userId: string, @Body() dto: ChatDto) {
    return this.agentService.chat(userId, dto.message, dto.conversationId);
  }

  @Sse('agent/stream')
  @ApiOperation({ summary: 'Agent 智能对话（流式 SSE，工具调用 + 实时回复）' })
  agentStream(@CurrentUser('id') userId: string, @Query() dto: ChatDto): Observable<string> {
    // 将 AsyncGenerator 转为 Observable，逐 token 推送
    return new Observable<string>((subscriber) => {
      (async () => {
        try {
          const gen = this.agentService.chatStream(userId, dto.message, dto.conversationId);
          for await (const chunk of gen) {
            subscriber.next(chunk);
          }
          subscriber.complete();
        } catch (e) {
          subscriber.error(e);
        }
      })();
    });
  }
}
