import request from './request'
import type {
  ApiApproval,
  ApiApprovalStatus,
  ApiApprovalType,
  ApiApprovalUrgency,
  ApiPendingStats,
  PaginatedData
} from '@/types'

/**
 * 审批接口对接
 * 后端 Controller 路径为 /approvals，主键为 UUID 字符串
 */

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

/** 审批列表（分页）*/
export const getApprovalList = (params?: ApprovalQueryParams) => {
  return request.get<PaginatedData<ApiApproval>>('/approvals', { params })
}

/** 我的申请（分页）*/
export const getMyApprovals = (params?: ApprovalQueryParams) => {
  return request.get<PaginatedData<ApiApproval>>('/approvals/my', { params })
}

/** 待处理统计（返回 { pendingCount }）*/
export const getPendingStats = () => {
  return request.get<ApiPendingStats>('/approvals/pending/stats')
}

/** 审批详情 */
export const getApprovalDetail = (id: string) => {
  return request.get<ApiApproval>(`/approvals/${id}`)
}

/** 提交审批 */
export const createApproval = (payload: CreateApprovalPayload) => {
  return request.post<ApiApproval>('/approvals', payload)
}

/** 修改申请（仅本人且处于 pending 状态）*/
export const updateApproval = (id: string, payload: UpdateApprovalPayload) => {
  return request.patch<ApiApproval>(`/approvals/${id}`, payload)
}

/**
 * 审批通过 / 驳回
 * 后端为 PATCH /approvals/:id/review，body: { status, remark? }
 * status 取 'approved' 或 'rejected'
 */
export const reviewApproval = (
  id: string,
  status: ApiApprovalStatus,
  remark?: string,
) => {
  return request.patch<ApiApproval>(`/approvals/${id}/review`, { status, remark })
}

/** 删除审批 */
export const deleteApproval = (id: string) => {
  return request.delete<{ id: string }>(`/approvals/${id}`)
}
