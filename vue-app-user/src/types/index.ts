export type ApprovalStatus = 'pending' | 'processing' | 'completed' | 'rejected'
export type ApprovalLevel = 'urgent' | 'warning' | 'info'
export type ApprovalType = 'leave' | 'reimburse' | 'purchase' | 'seal' | 'other' | 'budget' | 'meeting' | 'appraisal'

export interface User {
  id?: number | string
  name: string
  dept?: string
  email?: string
  avatar?: string
}

export interface Approval {
  id: number | string
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
  id: number | string
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
  /** 打字机动画进行中（历史消息回放用） */
  typing?: boolean
  /** Agent 流式输出进行中（实时追加 + 光标） */
  streaming?: boolean
  /** 思考步骤列表（流式期间捕获的工具调用轨迹） */
  thinkingSteps?: string[]
}

export interface AiSession {
  /** 后端会话 ID 为 UUID 字符串 */
  id: string
  title: string
  active: boolean
  createdAt?: string
  updatedAt?: string
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

// ============================================================
// 以下为与后端实体对齐的 API 数据类型（后端直接返回，无 ApiResponse 包裹）
// 实体主键均为 UUID 字符串；上方旧视图模型类型保留供现有页面使用
// ============================================================

/** 后端用户角色 / 状态 */
export type ApiUserRole = 'admin' | 'user'
export type ApiUserStatus = 'active' | 'disabled'

export interface ApiUser {
  id: string
  name: string
  email: string
  role: ApiUserRole
  dept: string
  avatarColor: string
  status: ApiUserStatus
  createdAt: string
  updatedAt?: string
}

export interface ApiLoginResult {
  token: string
  user: ApiUser
}

/** 后端审批类型 / 状态 / 紧急度（与 entities/approval.entity.ts 一致）*/
export type ApiApprovalType = 'leave' | 'expense' | 'procurement' | 'business_trip' | 'other'
export type ApiApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ApiApprovalUrgency = 'low' | 'medium' | 'high'

export interface ApiApproval {
  id: string
  applicantId: string
  type: ApiApprovalType
  title: string
  content: string
  amount: number | null
  status: ApiApprovalStatus
  urgency: ApiApprovalUrgency
  remark: string | null
  createdAt: string
  updatedAt: string
  applicant?: Pick<ApiUser, 'id' | 'name' | 'dept' | 'avatarColor' | 'role'>
}

/** 后端知识库文档（entities/kb.entity.ts）*/
export interface ApiKbDoc {
  id: string
  title: string
  category: string
  tags: string[]
  summary: string | null
  content: string
  authorId: string
  views: number
  createdAt: string
  updatedAt: string
  author?: Pick<ApiUser, 'id' | 'name' | 'dept' | 'avatarColor' | 'role'>
}

export interface ApiHotDoc {
  id: string
  title: string
  category: string
  views: number
  createdAt: string
}

/** 后端分页响应（service 统一返回 { list, total, page, pageSize }）*/
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 后端待处理统计 */
export interface ApiPendingStats {
  pendingCount: number
}

/** 后端仪表盘统计 */
export interface ApiDashboardStats {
  totalUsers: number
  activeUsers: number
  pendingApprovals: number
  totalDocs: number
}

export interface ApiTrendItem {
  date: string
  newUsers: number
  newApprovals: number
  newDocs: number
}

export interface ApiDeptContribution {
  dept: string
  count: number
}
