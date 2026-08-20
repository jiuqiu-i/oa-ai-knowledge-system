import request from './request'
import type {
  ApiApproval,
  ApiApprovalStatus,
  ApiPendingStats,
  ApprovalQueryParams,
  CreateApprovalPayload,
  UpdateApprovalPayload,
  PaginatedData
} from '@/types'

/**
 * 审批接口对接
 * 后端 Controller 路径为 /approvals，主键为 UUID 字符串
 */

/** 审批列表（分页）*/
export function getApprovalList(params?: ApprovalQueryParams) {
  return request.get<PaginatedData<ApiApproval>>('/approvals', { params })
}

/** 我的申请（分页）*/
export function getMyApprovals(params?: ApprovalQueryParams) {
  return request.get<PaginatedData<ApiApproval>>('/approvals/my', { params })
}

/** 待处理统计（返回 { pendingCount }）*/
export function getPendingStats() {
  return request.get<ApiPendingStats>('/approvals/pending/stats')
}

/** 审批详情 */
export function getApprovalDetail(id: string) {
  return request.get<ApiApproval>(`/approvals/${id}`)
}

/** 提交审批 */
export function createApproval(payload: CreateApprovalPayload) {
  return request.post<ApiApproval>('/approvals', payload)
}

/** 修改申请（仅本人且处于 pending 状态）*/
export function updateApproval(id: string, payload: UpdateApprovalPayload) {
  return request.patch<ApiApproval>(`/approvals/${id}`, payload)
}

/**
 * 审批通过 / 驳回
 * 后端为 PATCH /approvals/:id/review，body: { status, remark? }
 * status 取 'approved' 或 'rejected'
 */
export function reviewApproval(
  id: string,
  status: ApiApprovalStatus,
  remark?: string,
) {
  return request.patch<ApiApproval>(`/approvals/${id}/review`, { status, remark })
}

/** 删除审批 */
export function deleteApproval(id: string) {
  return request.delete<{ id: string }>(`/approvals/${id}`)
}

// ---------- 便捷封装（兼容旧调用方）----------

/** 审批通过 */
export function approveApproval(id: string, remark?: string) {
  return reviewApproval(id, 'approved', remark)
}

/** 驳回 */
export function rejectApproval(id: string, remark?: string) {
  return reviewApproval(id, 'rejected', remark)
}
