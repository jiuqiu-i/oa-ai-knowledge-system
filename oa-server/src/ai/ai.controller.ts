import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI 助手')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

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
}
