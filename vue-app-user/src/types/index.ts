export type ApprovalStatus = 'pending' | 'processing' | 'completed' | 'rejected'
export type ApprovalLevel = 'urgent' | 'warning' | 'info'
export type ApprovalType = 'leave' | 'reimburse' | 'purchase' | 'seal' | 'other' | 'budget' | 'meeting' | 'appraisal'

export interface User {
  id?: number
  name: string
  dept?: string
  email?: string
  avatar?: string
}

export interface Approval {
  id: number
  title: string
  from: string
  time: string
  type: ApprovalType
  status: ApprovalStatus
  level: ApprovalLevel
  content?: string
  amount?: number | null
}

export interface ApprovalStats {
  pending: number
  processing: number
  completed: number
}

export interface KbCategory {
  key: string
  label: string
  icon: string
}

export interface KbDoc {
  id: number
  title: string
  summary: string
  category: string
  tags: string[]
  author: string
  updated: string
  views: string
  icon: string
  updatedOrder: number
}

export type AiRole = 'user' | 'assistant' | 'system'

export interface AiMessage {
  id: string
  role: AiRole
  content: string
  typing?: boolean
}

export interface AiSession {
  id: number
  title: string
  active: boolean
}

export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  user: User
}
