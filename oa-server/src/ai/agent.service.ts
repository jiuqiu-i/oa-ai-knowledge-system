import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AiConversation, AiMessage } from '../entities/ai-conversation.entity';
import { AiToolsService } from './tools/ai-tools.service';
import { buildAiTools } from './tools/ai-tools.factory';

/**
 * Agent 智能编排服务
 *
 * 基于 LangChain.js createToolCallingAgent 实现"意图识别→工具调用→回复"全链路闭环：
 * 1) 大模型识别用户意图，决定是否调用工具（检索知识库/审批统计/仪表盘报表）
 * 2) Node.js 异步 I/O 高效处理并发工具调用
 * 3) 流式输出：Agent 每个输出 token 实时推送，工具调用阶段静默，最终回复实时流式
 *
 * 对应考核：第三阶段 Agent 任务编排 + 流式输出 + 工具函数调用
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;
  private readonly openaiBaseUrl: string;
  private readonly systemPrompt: string;
  private toolsService: AiToolsService | null = null;

  constructor(
    @InjectRepository(AiConversation)
    private conversationRepository: Repository<AiConversation>,
    private configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || '';
    this.systemPrompt =
      '你是一位 OA 办公智能助手，可以调用工具查询知识库、审批统计、仪表盘报表。' +
      '收到用户指令后：1) 判断是否需要调用工具获取实时数据；2) 需要时调用合适工具；' +
      '3) 基于工具返回的结构化数据用简洁中文给出回答或报表。' +
      '无需工具时直接回答。不要编造数据。';
  }

  setToolsService(toolsService: AiToolsService) {
    this.toolsService = toolsService;
  }

  /** 构建单次会话的 AgentExecutor（携带历史上下文） */
  private buildExecutor(history: AiMessage[]) {
    const llm = new ChatOpenAI({
      openAIApiKey: this.openaiApiKey,
      modelName: this.openaiModel,
      temperature: 0.3,
      streaming: true,
      configuration: this.openaiBaseUrl ? { baseURL: this.openaiBaseUrl } : undefined,
    });

    const tools = buildAiTools(this.toolsService!);

    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(this.systemPrompt),
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = createToolCallingAgent({ llm, tools, prompt });
    return new AgentExecutor({ agent, tools, verbose: false, maxIterations: 5 });
  }

  /** 将本地消息结构转为 LangChain 消息 */
  private toHistory(messages: AiMessage[]) {
    return messages.map((m) => {
      if (m.role === 'user') return new HumanMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new SystemMessage(m.content);
    });
  }

  /** 非流式 Agent 对话 */
  async chat(userId: string, message: string, conversationId?: string) {
    const conversation = await this.getOrCreateConversation(userId, conversationId);
    const history = conversation.getMessages();

    let reply: string;
    if (this.openaiApiKey && this.toolsService) {
      try {
        const executor = this.buildExecutor(history);
        const result = await executor.invoke({
          input: message,
          chat_history: this.toHistory(history),
        });
        reply = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
      } catch (e) {
        this.logger.error('Agent 执行失败，降级模拟回复', (e as Error).stack);
        reply = this.fallbackReply(message);
      }
    } else {
      this.logger.warn('未配置 OPENAI_API_KEY 或工具服务，使用模拟回复');
      reply = this.fallbackReply(message);
    }

    history.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    history.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    conversation.setMessages(history);
    if (conversation.title === '新会话') {
      conversation.title = message.slice(0, 20);
    }
    await this.conversationRepository.save(conversation);

    return {
      conversationId: conversation.id,
      title: conversation.title,
      reply,
      messages: history,
    };
  }

  /**
   * 流式 Agent 对话 - AsyncGenerator 逐 token 产出
   * 利用 Node.js 异步特性：工具调用阶段不阻塞事件循环，最终回复实时推送。
   */
  async *chatStream(userId: string, message: string, conversationId?: string): AsyncGenerator<string> {
    const conversation = await this.getOrCreateConversation(userId, conversationId);
    const history = conversation.getMessages();

    let reply = '';
    if (this.openaiApiKey && this.toolsService) {
      try {
        const executor = this.buildExecutor(history);
        const stream = await executor.stream({
          input: message,
          chat_history: this.toHistory(history),
        });

        for await (const chunk of stream) {
          // AgentExecutor stream 产出包含 steps/intermediate_steps 与最终 output
          // 仅在最终 output 文本阶段向外推送 token
          if (chunk && typeof chunk.output === 'string' && chunk.output) {
            // 整段 output 一次性产出，逐字推送以适配前端打字机
            for (const ch of chunk.output) {
              reply += ch;
              yield ch;
            }
          }
        }
        if (!reply) {
          reply = '（未产生回复）';
          yield reply;
        }
      } catch (e) {
        this.logger.error('Agent 流式执行失败，降级模拟流式回复', (e as Error).stack);
        reply = this.fallbackReply(message);
        for (const ch of reply) yield ch;
      }
    } else {
      this.logger.warn('未配置 OPENAI_API_KEY 或工具服务，使用模拟流式回复');
      reply = this.fallbackReply(message);
      for (const ch of reply) yield ch;
    }

    history.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    history.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    conversation.setMessages(history);
    if (conversation.title === '新会话') {
      conversation.title = message.slice(0, 20);
    }
    await this.conversationRepository.save(conversation);
  }

  private async getOrCreateConversation(userId: string, conversationId?: string) {
    if (conversationId) {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId, userId },
      });
      if (conversation) return conversation;
    }
    const conversation = this.conversationRepository.create({
      userId,
      title: '新会话',
      messages: JSON.stringify([]),
    });
    return this.conversationRepository.save(conversation);
  }

  private fallbackReply(message: string): string {
    return `（模拟回复）已收到："${message}"。当前未配置 OPENAI_API_KEY，Agent 能力未启用。` +
      '请在 .env 配置 OPENAI_API_KEY 后体验知识库检索、审批统计、仪表盘报表等智能工具调用。';
  }
}
