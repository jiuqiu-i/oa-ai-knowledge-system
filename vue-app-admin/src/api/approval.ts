import request from './request'
import type { ApiResponse, Approval, PaginatedData } from '@/types'

export function getApprovalList(params?: { page?: number; pageSize?: number; status?: string; type?: string }) {
  return request.get<ApiResponse<PaginatedData<Approval>>>('/approvals', { params })
}

export function getApprovalDetail(id: number) {
  return request.get<ApiResponse<Approval>>(`/approvals/${id}`)
}

export function approveApproval(id: number) {
  return request.post<ApiResponse<Approval>>(`/approvals/${id}/approve`)
}

export function rejectApproval(id: number) {
  return request.post<ApiResponse<Approval>>(`/approvals/${id}/reject`)
}

export function deleteApproval(id: number) {
  return request.delete<ApiResponse<null>>(`/approvals/${id}`)
}
