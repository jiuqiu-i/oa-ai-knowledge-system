import request from './request'
import type {
  ApiDashboardOverview,
  ApiDashboardStats,
  ApiDeptContribution,
  ApiTrendItem
} from '@/types'

/**
 * 仪表盘接口对接（后端 /dashboard，仅管理员可访问）
 */

/** 核心统计数据 */
export function getDashboardStats() {
  return request.get<ApiDashboardStats>('/dashboard/stats')
}

/**
 * 趋势数据（近 N 天）
 * 后端 /dashboard/trends，返回 [{ date, newUsers, newApprovals, newDocs }]
 */
export function getActivityTrend() {
  return request.get<ApiTrendItem[]>('/dashboard/trends')
}

/**
 * 部门贡献排行
 * 后端 /dashboard/dept-contributions，返回 [{ dept, count }]
 */
export function getDepartmentContribution() {
  return request.get<ApiDeptContribution[]>('/dashboard/dept-contributions')
}

/** 仪表盘总览（聚合 stats + trends + deptContributions）*/
export function getDashboardOverview() {
  return request.get<ApiDashboardOverview>('/dashboard/overview')
}
