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
  private readonly openaiTopP: number | undefined;
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
    // LangChain ChatOpenAI 默认 topP=1 会无条件发送；部分推理模型（如 kimi-k2.6）
    // 仅允许 top_p=0.95，故通过 env 覆盖；未配置时默认 0.95 以兼容推理模型。
    const envTopP = this.configService.get<string>('OPENAI_TOP_P');
    this.openaiTopP = envTopP === undefined ? 0.95 : Number(envTopP);
    this.systemPrompt =
      '你是一位 OA 办公智能助手，可以调用工具查询知识库、审批统计、仪表盘报表。\n' +
      '回答策略：\n' +
      '1) 优先检索知识库：当用户提出知识/文档/规范/制度/流程类问题时，先调用 search_knowledge_base 按关键词检索相关文档。\n' +
      '2) 命中即取详情：若检索结果非空，选取与用户问题最相关的 1-2 篇文档，调用 get_knowledge_base_detail 获取正文，基于其真实内容回答用户问题，并在回答末尾注明来源文档标题；禁止照搬全文，应提炼要点。\n' +
      '3) 未命中如实说明：若知识库无相关文档，明确告知用户知识库中暂无相关内容，必要时再调用其他工具或基于通用知识作答，严禁编造知识库中不存在的内容或文档。\n' +
      '4) 审批/报表类问题：按需调用 get_approval_stats 或 get_dashboard_report，用结构化数据给出回答或报表。\n' +
      '5) 无需工具时直接回答。所有回复使用简洁中文。';
  }

  setToolsService(toolsService: AiToolsService) {
    this.toolsService = toolsService;
  }

  /** 构建单次会话的 AgentExecutor（携带历史上下文） */
  private buildExecutor(history: AiMessage[]) {
    const llm = new ChatOpenAI({
      openAIApiKey: this.openaiApiKey,
      modelName: this.openaiModel,
      streaming: true,
      topP: this.openaiTopP,
      // temperature 不显式设置，由 API 默认值决定；部分推理模型（如 kimi-k2.6）仅允许 temperature=1
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
    // 知识库优先策略需"检索→取详情→回答"多步工具调用，迭代上限放宽至 8
    return new AgentExecutor({ agent, tools, verbose: false, maxIterations: 8 });
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
   * 流式 Agent 对话 - AsyncGenerator 产出结构化 SSE 事件
   *
   * 事件协议（JSON 字符串，前端二次解析）：
   *   {type:"thinking_step", content:"调用工具：知识库检索"}  — 思考步骤（工具调用）
   *   {type:"thinking_step", content:"知识库检索 执行完成"}  — 思考步骤（工具结束）
   *   {type:"token", content:"回复文本片段"}                — 最终回复 token
   *   {type:"done"}                                        — 流式结束
   *
   * 利用 streamEvents(v2) 同时捕获工具生命周期和 LLM token 流：
   * - on_tool_start/on_tool_end → 转为 thinking_step 事件，前端展示"思考过程"
   * - on_chat_model_stream → 转为 token 事件，前端以打字机效果展示最终回复
   */
  async *chatStream(userId: string, message: string, conversationId?: string): AsyncGenerator<string> {
    const conversation = await this.getOrCreateConversation(userId, conversationId);
    const history = conversation.getMessages();

    let reply = '';
    const thinkingSteps: string[] = [];
    if (this.openaiApiKey && this.toolsService) {
      try {
        const executor = this.buildExecutor(history);
        const eventStream = executor.streamEvents(
          { input: message, chat_history: this.toHistory(history) },
          { version: 'v2' },
        );

        for await (const event of eventStream) {
          // ---- 工具生命周期事件 → 思考步骤 ----
          if (event.event === 'on_tool_start') {
            const toolName = this.extractToolName(event);
            const step = `调用工具：${toolName}`;
            thinkingSteps.push(step);
            yield JSON.stringify({ type: 'thinking_step', content: step });
          } else if (event.event === 'on_tool_end') {
            const toolName = this.extractToolName(event);
            const step = `${toolName} 执行完成`;
            thinkingSteps.push(step);
            yield JSON.stringify({ type: 'thinking_step', content: step });
          }
          // ---- LLM token 流 → 回复 token ----
          else if (event.event === 'on_chat_model_stream') {
            const chunk: any = event?.data?.chunk;
            const token: string =
              chunk && typeof chunk.content === 'string'
                ? chunk.content
                : Array.isArray(chunk?.content)
                  ? chunk.content
                      .map((c: any) => (typeof c === 'string' ? c : c?.text || ''))
                      .join('')
                  : '';
            if (token) {
              reply += token;
              yield JSON.stringify({ type: 'token', content: token });
            }
          }
        }
        if (!reply) {
          reply = '（未产生回复）';
          yield JSON.stringify({ type: 'token', content: reply });
        }
      } catch (e) {
        this.logger.error('Agent 流式执行失败，降级模拟流式回复', (e as Error).stack);
        reply = this.fallbackReply(message);
        thinkingSteps.push('调用工具：降级模拟');
        yield JSON.stringify({ type: 'thinking_step', content: '调用工具：降级模拟' });
        yield JSON.stringify({ type: 'token', content: reply });
      }
    } else {
      this.logger.warn('未配置 OPENAI_API_KEY 或工具服务，使用模拟流式回复');
      reply = this.fallbackReply(message);
      thinkingSteps.push('未配置 AI，返回模拟回复');
      yield JSON.stringify({ type: 'thinking_step', content: '未配置 AI，返回模拟回复' });
      for (const ch of reply) {
        yield JSON.stringify({ type: 'token', content: ch });
      }
    }

    yield JSON.stringify({ type: 'done' });

    history.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    const assistantMsg: AiMessage = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
    if (thinkingSteps.length) {
      assistantMsg.thinkingSteps = thinkingSteps;
    }
    history.push(assistantMsg);
    conversation.setMessages(history);
    if (conversation.title === '新会话') {
      conversation.title = message.slice(0, 20);
    }
    await this.conversationRepository.save(conversation);
  }

  /** 从 LangChain 工具事件中提取工具中文名 */
  private extractToolName(event: any): string {
    // 工具中文名映射：LangChain 工具名 → 中文展示名
    const nameMap: Record<string, string> = {
      search_knowledge_base: '知识库检索',
      get_knowledge_base_detail: '知识库文档详情',
      get_approval_stats: '审批统计',
      get_dashboard_report: '仪表盘报表',
    };
    const rawName: string =
      event?.name || event?.data?.name || event?.data?.tool_name || 'unknown';
    return nameMap[rawName] || rawName.replace(/_/g, ' ');
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
