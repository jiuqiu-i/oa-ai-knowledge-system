import request from './request'
import { getToken } from './request'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// ---------- 会话管理（后端 /ai/conversations，主键为 UUID 字符串）----------

export interface ConversationVO {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ConversationDetailVO extends ConversationVO {
  messages: Array<{ role: string; content: string; timestamp?: string }>
}

/** 会话列表 */
export const getConversations = () => {
  return request.get<ConversationVO[]>('/ai/conversations')
}

/** 新建会话 */
export const createConversation = (title = '新会话') => {
  return request.post<ConversationVO>('/ai/conversations', { title })
}

/** 会话详情（含历史消息） */
export const getConversation = (id: string) => {
  return request.get<ConversationDetailVO>(`/ai/conversations/${id}`)
}

/** 删除会话 */
export const deleteConversation = (id: string) => {
  return request.delete<{ id: string }>(`/ai/conversations/${id}`)
}

/** Agent 非流式对话 */
export interface AgentReplyVO {
  conversationId: string
  title: string
  reply: string
  messages: Array<{ role: string; content: string; timestamp?: string }>
}

export const agentChat = (payload: { message: string; conversationId?: string }) => {
  return request.post<AgentReplyVO>('/ai/agent', payload)
}

/**
 * Agent 流式对话（SSE）
 *
 * EventSource 不支持自定义 Header（无法带 Authorization），故采用
 * fetch + ReadableStream + TextDecoder 解析 SSE data 帧。
 *
 * 后端 SSE 事件协议（JSON 字符串）：
 *   {type: 'thinking_step', content: '调用工具：知识库检索'}  — 思考步骤
 *   {type: 'token', content: '回复文本片段'}                — 最终回复 token
 *   {type: 'done'}                                          — 流式结束
 *
 * NestJS @Sse 会将字符串以 JSON 编码（带引号），故需二次 JSON.parse 解码。
 */
export interface AgentStreamCallbacks {
  onToken: (token: string) => void
  /** 思考步骤回调：工具调用开始/完成 */
  onThinkingStep?: (step: string) => void
  onDone: (fullText: string, conversationId?: string) => void
  onError: (err: unknown) => void
}

export const agentStream = async (
  payload: { message: string; conversationId?: string },
  cb: AgentStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> => {
  const token = getToken()
  const params = new URLSearchParams({ message: payload.message })
  if (payload.conversationId) params.set('conversationId', payload.conversationId)
  const url = `${API_BASE_URL}/ai/agent/stream?${params.toString()}`

  let fullText = ''
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal,
    })

    if (!res.ok || !res.body) {
      throw new Error(`SSE 连接失败: HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE 事件以空行分隔
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const evt of events) {
        // SSE 规范：一个 event 内多行 `data:` 须用 `\n` 拼接为完整 payload。
        // NestJS @Sse 对字符串值不做 JSON 编码（直接透传），对对象值才 JSON 编码。
        const dataLines = evt
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).replace(/^[ ]/, ''))
        if (!dataLines.length) continue

        const raw = dataLines.join('\n')
        if (raw === '[DONE]') {
          cb.onDone(fullText)
          return
        }

        // 解析策略：
        // 1) 尝试 JSON.parse — 若成功且是带 type 的对象 → 结构化事件
        // 2) 若成功且是字符串 → NestJS 编码的旧协议文本
        // 3) 若失败 → 纯文本 token（旧协议降级）
        let handled = false
        try {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object' && 'type' in parsed) {
            // 后端 v2 结构化事件：{type: 'token'|'thinking_step'|'done', content?: string}
            const e = parsed as { type: string; content?: string }
            if (e.type === 'thinking_step' && e.content) {
              cb.onThinkingStep?.(e.content)
              handled = true
            } else if (e.type === 'token' && e.content) {
              fullText += e.content
              cb.onToken(e.content)
              handled = true
            } else if (e.type === 'done') {
              cb.onDone(fullText)
              return
            }
          } else if (typeof parsed === 'string') {
            // NestJS 编码的字符串（旧协议）：直接作为 token
            fullText += parsed
            cb.onToken(parsed)
            handled = true
          }
        } catch {
          // JSON.parse 失败 → 纯文本 token
        }

        if (!handled) {
          fullText += raw
          cb.onToken(raw)
        }
      }
    }
    cb.onDone(fullText)
  } catch (e) {
    if ((e as Error).name === 'AbortError') return
    cb.onError(e)
  }
}
