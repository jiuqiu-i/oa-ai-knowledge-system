import request from './request'
import type { ApiResponse, AiMessage, AiSession } from '@/types'

export interface ChatPayload {
  sessionId?: number
  messages: Pick<AiMessage, 'role' | 'content'>[]
}

export const getSessions = () => {
  return request.get<ApiResponse<AiSession[]>>('/ai/sessions')
}

export const createSession = (title?: string) => {
  return request.post<ApiResponse<AiSession>>('/ai/sessions', { title })
}

export const getMessages = (sessionId: number) => {
  return request.get<ApiResponse<AiMessage[]>>(`/ai/sessions/${sessionId}/messages`)
}

export const sendChat = (payload: ChatPayload) => {
  return request.post<ApiResponse<AiMessage>>('/ai/chat', payload)
}
