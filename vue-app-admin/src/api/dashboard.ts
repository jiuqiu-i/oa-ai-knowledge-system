import request from './request'
import type { ApiResponse, DashboardStats } from '@/types'

export function getDashboardStats() {
  return request.get<ApiResponse<DashboardStats>>('/dashboard/stats')
}

export function getActivityTrend(period: string) {
  return request.get<ApiResponse<{ categories: string[]; data: number[] }>>('/dashboard/activity', {
    params: { period }
  })
}

export function getDepartmentContribution() {
  return request.get<ApiResponse<{ categories: string[]; data: number[] }>>('/dashboard/departments')
}
