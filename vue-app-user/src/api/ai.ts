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
 * NestJS @Sse 对 Observable<string> 会以 `data: "token"\n\n` 形式推送
 * （字符串被 JSON 编码），故此处对 data 先尝试 JSON.parse，失败则按原始文本处理。
 */
export interface AgentStreamCallbacks {
  onToken: (token: string) => void
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
        const dataLine = evt
          .split('\n')
          .find((l) => l.startsWith('data:'))
        if (!dataLine) continue

        const raw = dataLine.slice(5).trim()
        if (raw === '[DONE]') {
          cb.onDone(fullText)
          return
        }

        // NestJS @Sse 会将 string 以 JSON 编码（带引号），尝试解码
        let text: string
        try {
          const parsed = JSON.parse(raw)
          text = typeof parsed === 'string' ? parsed : String(parsed)
        } catch {
          text = raw
        }

        fullText += text
        cb.onToken(text)
      }
    }
    cb.onDone(fullText)
  } catch (e) {
    if ((e as Error).name === 'AbortError') return
    cb.onError(e)
  }
}
