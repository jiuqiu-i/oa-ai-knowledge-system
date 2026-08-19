import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { ChatOpenAI } from '@langchain/openai';
import { AiConversation, AiMessage } from '../entities/ai-conversation.entity';
import { ChatDto } from './dto/chat.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;

  constructor(
    @InjectRepository(AiConversation)
    private conversationRepository: Repository<AiConversation>,
    private configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
  }

  async getConversations(userId: string) {
    return this.conversationRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
    });
  }

  async getConversation(userId: string, id: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });
    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }
    return {
      ...conversation,
      messages: conversation.getMessages(),
    };
  }

  async createConversation(userId: string, title = '新会话') {
    const conversation = this.conversationRepository.create({
      userId,
      title,
      messages: JSON.stringify([]),
    });
    return this.conversationRepository.save(conversation);
  }

  async deleteConversation(userId: string, id: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });
    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }
    await this.conversationRepository.remove(conversation);
    return { id };
  }

  private async getOrCreateConversation(userId: string, conversationId?: string) {
    if (conversationId) {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId, userId },
      });
      if (!conversation) {
        throw new NotFoundException('会话不存在');
      }
      return conversation;
    }
    return this.createConversation(userId);
  }

  async chat(userId: string, dto: ChatDto) {
    const conversation = await this.getOrCreateConversation(userId, dto.conversationId);
    const messages = conversation.getMessages();
    messages.push({ role: 'user', content: dto.message, timestamp: new Date().toISOString() });

    const systemPrompt: AiMessage = {
      role: 'system',
      content: '你是一位OA办公助手，帮助用户解答审批、知识库、办公流程相关问题。请用中文简洁回答。',
    };

    let reply = '';
    if (this.openaiApiKey) {
      try {
        reply = await this.callOpenAI([systemPrompt, ...messages]);
      } catch (error) {
        this.logger.error('OpenAI调用失败', error);
        reply = this.getFallbackReply(dto.message);
      }
    } else {
      this.logger.warn('未配置 OPENAI_API_KEY，使用模拟回复');
      reply = this.getFallbackReply(dto.message);
    }

    messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    conversation.setMessages(messages);
    if (conversation.title === '新会话') {
      conversation.title = dto.message.slice(0, 20);
    }
    await this.conversationRepository.save(conversation);

    return {
      conversationId: conversation.id,
      title: conversation.title,
      reply,
      messages,
    };
  }

  chatStream(userId: string, dto: ChatDto): Observable<string> {
    return new Observable((subscriber) => {
      this.getOrCreateConversation(userId, dto.conversationId)
        .then(async (conversation) => {
          const messages = conversation.getMessages();
          messages.push({ role: 'user', content: dto.message, timestamp: new Date().toISOString() });

          const systemPrompt: AiMessage = {
            role: 'system',
            content: '你是一位OA办公助手，帮助用户解答审批、知识库、办公流程相关问题。请用中文简洁回答。',
          };

          let reply = '';
          const chunks = [];

          if (this.openaiApiKey) {
            try {
              const model: any = new ChatOpenAI({
                openAIApiKey: this.openaiApiKey,
                modelName: this.openaiModel,
                streaming: true,
              });
              const stream = await model.stream(this.toLangChainMessages([systemPrompt, ...messages]));
              for await (const chunk of stream) {
                const text = (chunk.content as string) || '';
                chunks.push(text);
                subscriber.next(text);
              }
              reply = chunks.join('');
            } catch (error) {
              this.logger.error('OpenAI流式调用失败', error);
              reply = this.getFallbackReply(dto.message);
              subscriber.next(reply);
            }
          } else {
            this.logger.warn('未配置 OPENAI_API_KEY，使用模拟流式回复');
            reply = this.getFallbackReply(dto.message);
            const words = reply.split('');
            for (const word of words) {
              subscriber.next(word);
              await this.delay(30);
            }
          }

          messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
          conversation.setMessages(messages);
          if (conversation.title === '新会话') {
            conversation.title = dto.message.slice(0, 20);
          }
          await this.conversationRepository.save(conversation);
          subscriber.complete();
        })
        .catch((error) => subscriber.error(error));
    });
  }

  private async callOpenAI(messages: AiMessage[]): Promise<string> {
    const model: any = new ChatOpenAI({
      openAIApiKey: this.openaiApiKey,
      modelName: this.openaiModel,
    });
    const result = await model.invoke(this.toLangChainMessages(messages));
    return (result.content as string) || '';
  }

  private toLangChainMessages(messages: AiMessage[]): [string, string][] {
    return messages.map((m) => {
      let role: string = m.role;
      if (role === 'user') role = 'human';
      if (role === 'assistant') role = 'ai';
      return [role, m.content];
    }) as [string, string][];
  }

  private getFallbackReply(message: string): string {
    return `（模拟回复）收到您的问题：“${message}”。当前未配置 OpenAI API Key，我将为您提供基础指引。请检查 .env 中的 OPENAI_API_KEY，配置后即可启用真实 AI 能力。`;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
