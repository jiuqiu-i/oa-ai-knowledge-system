export type UserRole = 'admin' | 'member' | 'visitor'
export type UserStatus = 'active' | 'inactive' | 'pending'

export interface User {
  id: number
  name: string
  email: string
  department: string
  role: UserRole
  status: UserStatus
  joinedAt: string
  avatar?: string
}

export type ApprovalType = 'leave' | 'reimburse' | 'purchase' | 'seal'
export type ApprovalStatus = 'pending' | 'processing' | 'approved' | 'rejected'

export interface ApprovalTimeline {
  time: string
  actor: string
  action: string
}

export interface Approval {
  id: number
  title: string
  applicant: string
  type: ApprovalType
  amount: number | null
  submitTime: string
  approver: string
  status: ApprovalStatus
  content: string
  timeline: ApprovalTimeline[]
}

export type KbDocStatus = '已发布' | '草稿' | '已归档'
export type KbDocStatusType = 'success' | 'warning' | 'default'

export interface KbDoc {
  id: number
  title: string
  category: string
  author: string
  updatedAt: string
  status: KbDocStatus
  statusType: KbDocStatusType
  content?: string
  attachment?: string | null
}

export interface KbDocPayload {
  title: string
  category: string
  author: string
  status: KbDocStatus
  content?: string
  attachment?: string | null
}

export interface KbCategory {
  label: string
  key: string
  children?: KbCategory[]
}

export interface DashboardMetric {
  label: string
  value: number
  trend: string
  trendText: string
  icon: unknown
  type: string
  trendType: string
}

export interface DashboardStats {
  totalEmployees: number
  todayActive: number
  pendingApprovals: number
  kbDocuments: number
}

export interface RecentLogin {
  name: string
  dept: string
  time: string
  color: string
}

export interface Announcement {
  type: 'info' | 'success' | 'warning'
  date: string
  title: string
}

export interface AiConfig {
  provider: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  enabled: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserPayload {
  name: string
  email: string
  department: string
  role: UserRole
  status: UserStatus
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface SelectOption {
  label: string
  value: string
}
