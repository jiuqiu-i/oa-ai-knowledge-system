export type UserRole = 'admin' | 'member' | 'visitor'
export type UserStatus = 'active' | 'inactive' | 'pending'

export interface User {
  id: number | string
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
  id: number | string
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
  id: number | string
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

// ============================================================
// 以下为与后端实体对齐的 API 数据类型（后端直接返回，无 ApiResponse 包裹）
// 实体主键均为 UUID 字符串；上方旧视图模型类型保留供现有页面使用
// ============================================================

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

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role?: ApiUserRole
  dept?: string
  status?: ApiUserStatus
  avatarColor?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: ApiUserRole
  dept?: string
  status?: ApiUserStatus
  avatarColor?: string
}

export interface UserQueryParams {
  keyword?: string
  dept?: string
  status?: ApiUserStatus
  page?: number
  pageSize?: number
}

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

export interface ApprovalQueryParams {
  keyword?: string
  type?: ApiApprovalType
  status?: ApiApprovalStatus
  page?: number
  pageSize?: number
}

export interface CreateApprovalPayload {
  type: ApiApprovalType
  title: string
  content: string
  amount?: number
  urgency?: ApiApprovalUrgency
}

export interface UpdateApprovalPayload {
  type?: ApiApprovalType
  title?: string
  content?: string
  amount?: number
  urgency?: ApiApprovalUrgency
}

export interface ApiPendingStats {
  pendingCount: number
}

export interface ApiKbDoc {
  id: string
  title: string
  category: string
  tags: string[]
  summary: string | null
  content: string
  attachment: string | null
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

export interface KbQueryParams {
  keyword?: string
  category?: string
  tag?: string
  page?: number
  pageSize?: number
}

export interface CreateKbPayload {
  title: string
  category: string
  tags?: string[]
  summary?: string
  content: string
  attachment?: string | null
}

export interface UploadKbFileResult {
  filename: string
  originalname: string
  size: number
  mimetype: string
  url: string
}

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

export interface ApiDashboardOverview extends ApiDashboardStats {
  trends: ApiTrendItem[]
  deptContributions: ApiDeptContribution[]
}
