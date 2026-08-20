import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ApiDashboardStats,
  ApiTrendItem,
  ApiDeptContribution
} from '@/types'
import {
  getDashboardStats,
  getActivityTrend,
  getDepartmentContribution
} from '@/api/dashboard'

/**
 * 仪表盘 store：对接 /dashboard/*
 * 后端不可达时保留演示数据，保证 UI 可用。
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // 核心统计（演示兜底）
  const stats = ref<ApiDashboardStats>({
    totalUsers: 1248,
    activeUsers: 892,
    pendingApprovals: 34,
    totalDocs: 3621
  })

  // 活跃度趋势（演示兜底，用于折线图）
  const trends = ref<ApiTrendItem[]>([
    { date: '周一', newUsers: 720, newApprovals: 12, newDocs: 8 },
    { date: '周二', newUsers: 810, newApprovals: 15, newDocs: 10 },
    { date: '周三', newUsers: 795, newApprovals: 9, newDocs: 6 },
    { date: '周四', newUsers: 860, newApprovals: 18, newDocs: 12 },
    { date: '周五', newUsers: 892, newApprovals: 20, newDocs: 15 },
    { date: '周六', newUsers: 650, newApprovals: 4, newDocs: 2 },
    { date: '周日', newUsers: 680, newApprovals: 6, newDocs: 3 }
  ])

  // 部门贡献（演示兜底，用于柱状图）
  const deptContributions = ref<ApiDeptContribution[]>([
    { dept: '技术部', count: 420 },
    { dept: '产品部', count: 310 },
    { dept: '人事部', count: 180 },
    { dept: '财务部', count: 150 },
    { dept: '市场部', count: 260 },
    { dept: '运营部', count: 210 }
  ])

  const loading = ref(false)

  /** 拉取核心统计 */
  const fetchStats = async () => {
    try {
      const { data } = await getDashboardStats()
      stats.value = data
    } catch {
      // 保留演示数据
    }
  }

  /** 拉取活跃度趋势 */
  const fetchTrends = async () => {
    try {
      const { data } = await getActivityTrend()
      if (data?.length) trends.value = data
    } catch {
      // 保留演示数据
    }
  }

  /** 拉取部门贡献 */
  const fetchDeptContributions = async () => {
    try {
      const { data } = await getDepartmentContribution()
      if (data?.length) deptContributions.value = data
    } catch {
      // 保留演示数据
    }
  }

  /** 一次性拉取所有仪表盘数据 */
  const fetchAll = async () => {
    loading.value = true
    await Promise.all([fetchStats(), fetchTrends(), fetchDeptContributions()])
    loading.value = false
  }

  return {
    stats,
    trends,
    deptContributions,
    loading,
    fetchStats,
    fetchTrends,
    fetchDeptContributions,
    fetchAll
  }
})
