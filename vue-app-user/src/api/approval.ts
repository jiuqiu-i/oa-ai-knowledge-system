import request from './request'
import type { ApiResponse, Approval, ApprovalStats } from '@/types'

export interface CreateApprovalPayload {
  title: string
  type: string
  content: string
  amount?: number
}

export const getApprovalList = (params?: { status?: string; page?: number; size?: number }) => {
  return request.get<ApiResponse<Approval[]>>('/approvals', { params })
}

export const getApprovalStats = () => {
  return request.get<ApiResponse<ApprovalStats>>('/approvals/stats')
}

export const getApprovalDetail = (id: number) => {
  return request.get<ApiResponse<Approval>>(`/approvals/${id}`)
}

export const createApproval = (payload: CreateApprovalPayload) => {
  return request.post<ApiResponse<Approval>>('/approvals', payload)
}

export const approveApproval = (id: number, comment?: string) => {
  return request.post<ApiResponse<Approval>>(`/approvals/${id}/approve`, { comment })
}

export const rejectApproval = (id: number, comment?: string) => {
  return request.post<ApiResponse<Approval>>(`/approvals/${id}/reject`, { comment })
}
