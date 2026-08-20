<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import {
  NGrid,
  NGridItem,
  NCard,
  NStatistic,
  NSpace,
  NButton,
  NSelect,
  NTag,
  NDataTable,
  NAvatar,
  NText,
  useMessage
} from 'naive-ui'
import {
  Users,
  Activity,
  ClipboardList,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  ChevronRight,
  Check,
  X
} from 'lucide-vue-next'
import type { EChartsOption } from 'echarts'
import EChart from '@/components/EChart.vue'
import type { Announcement, RecentLogin } from '@/types'
import { useDashboardStore } from '@/stores'

const router = useRouter()
const message = useMessage()
const dashboardStore = useDashboardStore()

// 进入页面拉取真实仪表盘数据（后端不可达时保留演示兜底）
onMounted(() => {
  dashboardStore.fetchAll()
})

const period = ref<string>('7')
const periodOptions: SelectOption[] = [
  { label: '近 7 天', value: '7' },
  { label: '近 30 天', value: '30' }
]

const activityOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#E8E2D9',
    borderWidth: 1,
    textStyle: { color: '#2A261F' },
    padding: [12, 16],
    formatter: (params: unknown) => {
      const p = (params as { name: string; seriesName: string; value: number; color: string }[])[0]
      return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                <span>${p.seriesName}：</span>
                <strong>${p.value}</strong>
              </div>`
    }
  },
  grid: {
    left: 0,
    right: 16,
    top: 24,
    bottom: 8,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: dashboardStore.trends.map((t) => t.date),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6E665B', fontSize: 12 }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#E8E2D9', type: 'dashed' } },
    axisLabel: { color: '#6E665B', fontSize: 12 }
  },
  series: [
    {
      name: '活跃用户数',
      type: 'line',
      data: dashboardStore.trends.map((t) => t.newUsers),
      smooth: true,
      symbolSize: 8,
      lineStyle: { color: '#E58A2E', width: 3 },
      itemStyle: { color: '#E58A2E', borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(229, 138, 46, 0.28)' },
            { offset: 1, color: 'rgba(229, 138, 46, 0.02)' }
          ]
        }
      }
    }
  ]
}))

const deptOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: '#fff',
    borderColor: '#E8E2D9',
    borderWidth: 1,
    textStyle: { color: '#2A261F' },
    padding: [12, 16],
    formatter: (params: unknown) => {
      const p = (params as { name: string; seriesName: string; value: number; color: string }[])[0]
      return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                <span>${p.seriesName}：</span>
                <strong>${p.value}</strong>
              </div>`
    }
  },
  grid: {
    left: 0,
    right: 16,
    top: 16,
    bottom: 8,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: dashboardStore.deptContributions.map((d) => d.dept),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6E665B', fontSize: 12 }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#E8E2D9', type: 'dashed' } },
    axisLabel: { color: '#6E665B', fontSize: 12 }
  },
  series: [
    {
      name: '文档贡献数',
      type: 'bar',
      data: dashboardStore.deptContributions.map((d) => d.count),
      barWidth: 22,
      itemStyle: {
        borderRadius: [5, 5, 0, 0],
        color: (params: unknown) => {
          const colors = ['#E58A2E', '#2E90FA', '#34A853', '#F5B800', '#9F968A', '#2A261F']
          return colors[(params as { dataIndex: number }).dataIndex % colors.length]
        }
      }
    }
  ]
}))

interface MetricCard {
  label: string
  value: number
  trend: string
  trendText: string
  icon: Component
  type: string
  trendType: string
}

const metricCards = computed<MetricCard[]>(() => [
  { label: '总员工数', value: dashboardStore.stats.totalUsers, trend: '总数', trendText: '员工总数', icon: Users, type: 'primary', trendType: 'success' },
  { label: '今日活跃', value: dashboardStore.stats.activeUsers, trend: '活跃', trendText: '活跃用户', icon: Activity, type: 'info', trendType: 'success' },
  { label: '待处理审批', value: dashboardStore.stats.pendingApprovals, trend: '待审批', trendText: '需关注', icon: ClipboardList, type: 'warning', trendType: 'error' },
  { label: '知识库文档数', value: dashboardStore.stats.totalDocs, trend: '文档', trendText: '文档总数', icon: BookOpen, type: 'success', trendType: 'success' }
])

const typeIconMap: Record<string, Component> = {
  info: Info,
  success: CheckCircle,
  warning: Bell
}

const typeColorMap: Record<string, { bg: string; color: string }> = {
  info: { bg: 'rgba(46, 144, 250, 0.1)', color: '#2E90FA' },
  success: { bg: 'rgba(52, 168, 83, 0.1)', color: '#34A853' },
  warning: { bg: 'rgba(245, 184, 0, 0.1)', color: '#F5B800' }
}

const announcements: Announcement[] = [
  {
    type: 'info',
    date: '2026-08-15',
    title: '系统将于本周日凌晨 02:00 进行例行维护'
  },
  {
    type: 'success',
    date: '2026-08-14',
    title: '知识库 AI 检索功能已完成升级'
  },
  {
    type: 'warning',
    date: '2026-08-12',
    title: '请各部门在 8 月 20 日前完成考勤确认'
  }
]

const recentLogins: RecentLogin[] = [
  { name: '李思远', dept: '技术部 · 高级工程师', time: '2 分钟前', color: '#E58A2E' },
  { name: '王嘉怡', dept: '人事部 · HRBP', time: '15 分钟前', color: '#2E90FA' },
  { name: '张伟', dept: '产品部 · 产品经理', time: '32 分钟前', color: '#34A853' },
  { name: '陈静', dept: '财务部 · 财务主管', time: '1 小时前', color: '#F5B800' }
]

interface PendingApprovalRow {
  applicant: string
  type: string
  time: string
  status: string
  statusType: string
  avatarColor?: string
}

const approvalColumns: DataTableColumns<PendingApprovalRow> = [
  {
    title: '申请人',
    key: 'applicant',
    width: 120,
    render(row) {
      return h(
        NSpace,
        { align: 'center', size: 10 },
        {
          default: () => [
            h(NAvatar, {
              round: true,
              size: 32,
              style: { background: row.avatarColor || '#E58A2E', color: '#fff', fontSize: '12px', fontWeight: 600 }
            }, { default: () => row.applicant.charAt(0) }),
            h('span', { style: { fontWeight: 500, color: '#2A261F' } }, row.applicant)
          ]
        }
      )
    }
  },
  { title: '类型', key: 'type', width: 120 },
  { title: '时间', key: 'time', width: 160 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.statusType as never, size: 'small', round: true, bordered: false },
        { default: () => row.status, icon: () => h(AlertCircle, { size: 12 }) }
      )
    }
  },
  {
    title: '操作',
    key: 'actions',
    align: 'right',
    width: 160,
    render() {
      return h(
        NSpace,
        { size: 8, justify: 'end' },
        {
          default: () => [
            h(
              NButton,
              {
                quaternary: true,
                type: 'success',
                size: 'small',
                onClick: () => message.success('已通过')
              },
              { default: () => '通过', icon: () => h(Check, { size: 14 }) }
            ),
            h(
              NButton,
              {
                quaternary: true,
                type: 'error',
                size: 'small',
                onClick: () => message.warning('已驳回')
              },
              { default: () => '驳回', icon: () => h(X, { size: 14 }) }
            )
          ]
        }
      )
    }
  }
]

const approvalData: PendingApprovalRow[] = [
  { applicant: '李思远', type: '请假申请', time: '2026-08-16 09:12', status: '待审批', statusType: 'warning', avatarColor: '#E58A2E' },
  { applicant: '王嘉怡', type: '报销申请', time: '2026-08-16 08:45', status: '待审批', statusType: 'warning', avatarColor: '#2E90FA' },
  { applicant: '张伟', type: '采购申请', time: '2026-08-15 17:30', status: '待复核', statusType: 'info', avatarColor: '#34A853' },
  { applicant: '陈静', type: '用车申请', time: '2026-08-15 16:08', status: '待审批', statusType: 'warning', avatarColor: '#F5B800' },
  { applicant: '刘洋', type: '加班申请', time: '2026-08-15 14:22', status: '待复核', statusType: 'info', avatarColor: '#9F968A' }
]

function viewAllApprovals() {
  router.push('/admin/approvals')
}

function exportChart() {
  message.info('导出功能演示')
}
</script>

<template>
  <div class="dashboard-page">
    <!-- Metric cards -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" class="metric-grid">
      <n-grid-item v-for="(card, index) in metricCards" :key="index" span="4 s:2 l:1">
        <n-card class="metric-card" :bordered="false">
          <n-space vertical :size="12">
            <n-space align="start" justify="space-between">
              <n-space vertical :size="4">
                <n-text class="metric-label">{{ card.label }}</n-text>
                <n-statistic :value="card.value" class="metric-value" />
              </n-space>
              <div class="metric-icon" :class="card.type">
                <component :is="card.icon" :size="22" />
              </div>
            </n-space>
            <n-space align="center" :size="8" class="metric-trend">
              <n-tag :type="card.trendType as never" size="small" round :bordered="false">
                <template #icon>
                  <TrendingUp :size="12" />
                </template>
                {{ card.trend }}
              </n-tag>
              <n-text class="trend-text">{{ card.trendText }}</n-text>
            </n-space>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- Charts + sidebar -->
    <n-grid :cols="3" :x-gap="16" :y-gap="16" class="main-grid">
      <n-grid-item span="3 l:2">
        <n-card class="chart-card" :bordered="false" segmented>
          <template #header>
            <span class="section-title">系统活跃度趋势</span>
          </template>
          <template #header-extra>
            <n-select v-model:value="period" :options="periodOptions" size="small" style="width: 100px" />
          </template>
          <EChart :option="activityOption" height="280px" />
        </n-card>

        <n-card class="chart-card" :bordered="false" segmented>
          <template #header>
            <span class="section-title">各部门知识贡献</span>
          </template>
          <template #header-extra>
            <n-button quaternary type="primary" size="small" @click="exportChart">
              导出
            </n-button>
          </template>
          <EChart :option="deptOption" height="248px" />
        </n-card>
      </n-grid-item>

      <n-grid-item span="3 l:1">
        <n-card class="side-card" :bordered="false" segmented>
          <template #header>
            <span class="section-title">系统公告</span>
          </template>
          <template #header-extra>
            <n-button text type="primary" size="small">全部</n-button>
          </template>
          <div class="announcement-list">
            <div
              v-for="(item, index) in announcements"
              :key="index"
              class="announcement-item"
            >
              <div class="announcement-top">
                <span
                  class="announcement-icon"
                  :style="{ background: typeColorMap[item.type].bg, color: typeColorMap[item.type].color }"
                >
                  <component :is="typeIconMap[item.type]" :size="12" />
                </span>
                <span class="announcement-date">{{ item.date }}</span>
              </div>
              <p class="announcement-title">{{ item.title }}</p>
            </div>
          </div>
        </n-card>

        <n-card class="side-card" :bordered="false" segmented>
          <template #header>
            <span class="section-title">最近登录</span>
          </template>
          <template #header-extra>
            <n-button text type="primary" size="small">查看</n-button>
          </template>
          <div class="login-list">
            <div
              v-for="(item, index) in recentLogins"
              :key="index"
              class="login-item"
            >
              <div class="login-left">
                <span
                  class="login-avatar"
                  :style="{ background: item.color }"
                >
                  {{ item.name.charAt(0) }}
                </span>
                <div class="login-info">
                  <p class="login-name">{{ item.name }}</p>
                  <p class="login-dept">{{ item.dept }}</p>
                </div>
              </div>
              <span class="login-time">{{ item.time }}</span>
            </div>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- Pending approvals table -->
    <n-card class="approval-card" :bordered="false" segmented>
      <template #header>
        <span class="section-title">待处理审批</span>
      </template>
      <template #header-extra>
        <n-button text type="primary" size="small" @click="viewAllApprovals">
          查看全部
          <template #icon>
            <ChevronRight :size="16" />
          </template>
        </n-button>
      </template>
      <n-data-table
        :columns="approvalColumns"
        :data="approvalData"
        :bordered="false"
        :single-line="true"
        size="small"
        striped
        class="approval-table"
      />
    </n-card>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metric-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.metric-label {
  font-size: 13px;
  color: #6E665B;
  font-weight: 500;
}

.metric-value :deep(.n-statistic__value) {
  font-size: 30px;
  font-weight: 700;
  color: #2A261F;
  line-height: 1.2;
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.metric-icon.primary {
  background: rgba(229, 138, 46, 0.12);
  color: #E58A2E;
}

.metric-icon.info {
  background: rgba(46, 144, 250, 0.12);
  color: #2E90FA;
}

.metric-icon.warning {
  background: rgba(245, 184, 0, 0.12);
  color: #F5B800;
}

.metric-icon.success {
  background: rgba(52, 168, 83, 0.12);
  color: #34A853;
}

.metric-trend {
  margin-top: 16px;
}

.trend-text {
  font-size: 13px;
  color: #9F968A;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #2A261F;
}

.chart-card {
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.chart-card:last-child {
  margin-bottom: 0;
}

.side-card {
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.side-card:last-child {
  margin-bottom: 0;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-item {
  padding: 12px;
  background: #F7F4EF;
  border-radius: 8px;
  border: 1px solid #E8E2D9;
  transition: background 0.2s ease;
}

.announcement-item:hover {
  background: #F5F1EB;
}

.announcement-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.announcement-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.announcement-date {
  font-size: 12px;
  font-weight: 500;
  color: #9F968A;
}

.announcement-title {
  margin: 8px 0 0 0;
  font-size: 14px;
  font-weight: 500;
  color: #2A261F;
  line-height: 1.5;
}

.login-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.login-info {
  display: flex;
  flex-direction: column;
}

.login-name {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #2A261F;
}

.login-dept {
  margin: 0;
  font-size: 12px;
  color: #9F968A;
}

.login-time {
  font-size: 12px;
  color: #9F968A;
}

.approval-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.approval-table :deep(.n-data-table-td) {
  padding: 12px 16px;
}

.approval-table :deep(.n-data-table-th) {
  font-weight: 600;
  color: #6E665B;
  background: #FAF8F4;
}
</style>
