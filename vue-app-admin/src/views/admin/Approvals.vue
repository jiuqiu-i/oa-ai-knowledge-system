<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import type { Component } from 'vue'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import {
  NGrid,
  NGridItem,
  NCard,
  NInput,
  NSelect,
  NButton,
  NDataTable,
  NTag,
  NSpace,
  NDrawer,
  NDrawerContent,
  NTimeline,
  NTimelineItem,
  NAvatar,
  NPagination,
  useMessage
} from 'naive-ui'
import {
  Search,
  Plus,
  Clock,
  Loader,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-vue-next'
import type { Approval, ApprovalStatus, ApprovalType } from '@/types'
import { useApprovalStore } from '@/stores'

const message = useMessage()
const approvalStore = useApprovalStore()

// 后端可达时用真实数据覆盖演示数据
onMounted(() => {
  approvalStore.fetchApprovals()
})

const searchKeyword = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

const typeOptions: SelectOption[] = [
  { label: '全部类型', value: '' },
  { label: '请假', value: 'leave' },
  { label: '报销', value: 'reimburse' },
  { label: '采购', value: 'purchase' },
  { label: '用印', value: 'seal' }
]

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '待审批', value: 'pending' },
  { label: '审批中', value: 'processing' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' }
]

const typeMap: Record<ApprovalType, string> = {
  leave: '请假',
  reimburse: '报销',
  purchase: '采购',
  seal: '用印'
}

const statusMeta: Record<ApprovalStatus, { label: string; type: string; icon: Component }> = {
  pending: { label: '待审批', type: 'warning', icon: Clock },
  processing: { label: '审批中', type: 'info', icon: Loader },
  approved: { label: '已通过', type: 'success', icon: CheckCircle },
  rejected: { label: '已驳回', type: 'error', icon: XCircle }
}

interface StatCard {
  label: string
  value: number
  trend: string
  trendType: 'up' | 'down' | 'flat'
  icon: Component
  color: string
}

const stats: StatCard[] = [
  { label: '待审批', value: 12, trend: '+8.3%', trendType: 'up', icon: Clock, color: '#F5B800' },
  { label: '审批中', value: 8, trend: '-4.1%', trendType: 'down', icon: Loader, color: '#2E90FA' },
  { label: '已通过', value: 56, trend: '+12.7%', trendType: 'up', icon: CheckCircle, color: '#34A853' },
  { label: '已驳回', value: 7, trend: '持平', trendType: 'flat', icon: XCircle, color: '#EA4335' }
]

const initialApprovals: Approval[] = [
  { id: 1, title: 'Q3 团建费用报销', applicant: '张伟', type: 'reimburse', amount: 3280, submitTime: '2026-08-19 09:30', approver: '李经理', status: 'pending', content: '部门 Q3 团建活动费用报销，包含餐饮、交通及场地费用，附发票 6 张。', timeline: [{ time: '2026-08-19 09:30', actor: '张伟', action: '提交申请' }] },
  { id: 2, title: '年假申请（3天）', applicant: '王芳', type: 'leave', amount: null, submitTime: '2026-08-18 16:45', approver: '刘主管', status: 'processing', content: '因个人事务申请 8 月 21 日至 8 月 23 日年假，共计 3 个工作日，已做好工作交接。', timeline: [{ time: '2026-08-18 16:45', actor: '王芳', action: '提交申请' }, { time: '2026-08-18 17:02', actor: '刘主管', action: '转交部门总监' }] },
  { id: 3, title: '办公电脑采购申请', applicant: '李娜', type: 'purchase', amount: 12800, submitTime: '2026-08-18 11:20', approver: '陈总监', status: 'approved', content: '为新入职研发人员采购高性能笔记本 2 台，预算内执行。', timeline: [{ time: '2026-08-18 11:20', actor: '李娜', action: '提交申请' }, { time: '2026-08-18 14:10', actor: '陈总监', action: '审批通过' }] },
  { id: 4, title: '销售合同用印申请', applicant: '赵强', type: 'seal', amount: null, submitTime: '2026-08-17 15:00', approver: '孙经理', status: 'rejected', content: '客户 A 项目合同用印，合同金额 50 万元，因条款需要补充法务审核意见被驳回。', timeline: [{ time: '2026-08-17 15:00', actor: '赵强', action: '提交申请' }, { time: '2026-08-17 16:30', actor: '孙经理', action: '驳回申请' }] },
  { id: 5, title: '差旅费用报销', applicant: '陈晨', type: 'reimburse', amount: 2150, submitTime: '2026-08-17 10:10', approver: '李经理', status: 'pending', content: '上海出差往返机票及酒店费用报销，附行程单与发票。', timeline: [{ time: '2026-08-17 10:10', actor: '陈晨', action: '提交申请' }] },
  { id: 6, title: '病假申请（1天）', applicant: '刘洋', type: 'leave', amount: null, submitTime: '2026-08-16 08:20', approver: '刘主管', status: 'approved', content: '因身体不适申请 8 月 16 日病假一天，已提交医院诊断证明。', timeline: [{ time: '2026-08-16 08:20', actor: '刘洋', action: '提交申请' }, { time: '2026-08-16 09:05', actor: '刘主管', action: '审批通过' }] },
  { id: 7, title: '服务器扩容采购', applicant: '周杰', type: 'purchase', amount: 56000, submitTime: '2026-08-15 14:00', approver: '陈总监', status: 'processing', content: '为应对业务增长，申请采购云服务器资源一年，需财务复核预算。', timeline: [{ time: '2026-08-15 14:00', actor: '周杰', action: '提交申请' }, { time: '2026-08-16 09:30', actor: '陈总监', action: '转交财务复核' }] },
  { id: 8, title: '市场推广用印申请', applicant: '吴敏', type: 'seal', amount: null, submitTime: '2026-08-15 09:45', approver: '孙经理', status: 'pending', content: 'Q3 市场推广活动合作协议用印，合作金额 8 万元。', timeline: [{ time: '2026-08-15 09:45', actor: '吴敏', action: '提交申请' }] }
]
approvalStore.setApprovals(initialApprovals)

const filteredApprovals = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return approvalStore.approvals.filter(item => {
    const matchKeyword = !keyword || item.title.toLowerCase().includes(keyword) || item.applicant.toLowerCase().includes(keyword)
    const matchType = !typeFilter.value || item.type === typeFilter.value
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
    return matchKeyword && matchType && matchStatus
  })
})

function formatAmount(amount: number | null) {
  return amount == null ? '-' : '¥' + amount.toLocaleString('zh-CN')
}

function renderStatus(status: ApprovalStatus) {
  const meta = statusMeta[status]
  return h(NTag, { type: meta.type as never, size: 'small', round: true }, {
    default: () => meta.label,
    icon: () => h(meta.icon, { size: 12 })
  })
}

const columns: DataTableColumns<Approval> = [
  {
    title: '审批标题',
    key: 'title',
    render(row) {
      return h(NButton, { text: true, type: 'primary', onClick: () => openDrawer(row.id) }, { default: () => row.title })
    }
  },
  { title: '申请人', key: 'applicant' },
  { title: '类型', key: 'type', render: row => typeMap[row.type] },
  { title: '金额', key: 'amount', render: row => formatAmount(row.amount) },
  { title: '提交时间', key: 'submitTime' },
  { title: '当前审批人', key: 'approver' },
  { title: '状态', key: 'status', render: row => renderStatus(row.status) },
  {
    title: '操作',
    key: 'actions',
    align: 'right',
    render(row) {
      return h(NSpace, { size: 4, justify: 'end' }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, onClick: () => openDrawer(row.id) }, { icon: () => h(Eye, { size: 16 }) }),
          ...(row.status === 'pending' || row.status === 'processing'
            ? [
                h(NButton, { size: 'small', quaternary: true, type: 'success', onClick: () => approveItem(row.id) }, { icon: () => h(Check, { size: 16 }) }),
                h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => rejectItem(row.id) }, { icon: () => h(X, { size: 16 }) })
              ]
            : []),
          h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => deleteItem(row.id) }, { icon: () => h(Trash2, { size: 16 }) })
        ]
      })
    }
  }
]

const showDrawer = ref(false)
const currentDetail = ref<Approval | null>(null)

function openDrawer(id: number | string) {
  const item = approvalStore.getApprovalById(id)
  if (!item) return
  currentDetail.value = item
  showDrawer.value = true
}

function closeDrawer() {
  showDrawer.value = false
  currentDetail.value = null
}

async function approveItem(id: number | string) {
  const item = approvalStore.getApprovalById(id)
  await approvalStore.approveItem(id)
  message.success(`「${item?.title ?? ''}」已通过`)
}

async function rejectItem(id: number | string) {
  const item = approvalStore.getApprovalById(id)
  await approvalStore.rejectItem(id)
  message.error(`「${item?.title ?? ''}」已驳回`)
}

async function deleteItem(id: number | string) {
  const item = approvalStore.getApprovalById(id)
  await approvalStore.deleteItem(id)
  message.info(`已删除「${item?.title ?? ''}」`)
  if (currentDetail.value?.id === id) closeDrawer()
}

function createApproval() {
  message.info('已打开发起审批面板')
}
</script>

<template>
  <div class="approvals-page">
    <!-- Stats cards -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" class="stats-grid">
      <n-grid-item v-for="(stat, index) in stats" :key="index" span="4 s:2 l:1">
        <n-card class="stat-card" :bordered="false">
          <div class="stat-top">
            <span class="stat-label">{{ stat.label }}</span>
            <span
              class="stat-icon"
              :style="{ background: stat.color + '1F', color: stat.color }"
            >
              <component :is="stat.icon" :size="16" />
            </span>
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-trend">
            <component
              :is="stat.trendType === 'up' ? TrendingUp : stat.trendType === 'down' ? TrendingDown : Minus"
              :size="12"
              :style="{ color: stat.trendType === 'up' ? '#34A853' : stat.trendType === 'down' ? '#EA4335' : '#9F968A' }"
            />
            <span
              class="trend-text"
              :style="{ color: stat.trendType === 'up' ? '#34A853' : stat.trendType === 'down' ? '#EA4335' : '#9F968A' }"
            >
              环比 {{ stat.trend }}
            </span>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- Toolbar -->
    <n-card class="toolbar-card">
      <n-space justify="space-between" align="center" wrap>
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="按标题/申请人搜索..." style="width: 280px">
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>
          <n-select v-model:value="typeFilter" :options="typeOptions" style="width: 140px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" style="width: 140px" />
        </n-space>
        <n-button type="primary" @click="createApproval">
          <template #icon>
            <Plus :size="16" />
          </template>
          发起审批
        </n-button>
      </n-space>
    </n-card>

    <!-- Approval table -->
    <n-card class="table-card">
      <n-data-table
        :columns="columns"
        :data="filteredApprovals"
        :bordered="false"
        :single-line="false"
        size="small"
      />
      <div class="pagination-bar">
        <span class="pagination-text">共 83 条，每页 10 条</span>
        <n-pagination :page="1" :page-size="10" :item-count="83" />
      </div>
    </n-card>

    <!-- Approval detail drawer -->
    <n-drawer v-model:show="showDrawer" :width="480" placement="right">
      <n-drawer-content v-if="currentDetail" title="审批详情" closable>
        <div class="drawer-body">
          <n-space align="center" :size="16" class="drawer-header">
            <n-avatar
              round
              :size="40"
              :style="{ background: '#E58A2E', color: '#fff', fontSize: '14px', fontWeight: 600 }"
            >
              {{ currentDetail.applicant.charAt(0) }}
            </n-avatar>
            <div>
              <div class="applicant-name">{{ currentDetail.applicant }}</div>
              <div class="applicant-meta">{{ currentDetail.applicant }}@oakoa.com · 提交于 {{ currentDetail.submitTime }}</div>
            </div>
          </n-space>

          <n-card class="detail-card" :bordered="true" size="small">
            <n-grid :cols="2" :x-gap="16" :y-gap="12">
              <n-grid-item>
                <div class="detail-label">审批类型</div>
                <div class="detail-value">{{ typeMap[currentDetail.type] }}</div>
              </n-grid-item>
              <n-grid-item>
                <div class="detail-label">当前审批人</div>
                <div class="detail-value">{{ currentDetail.approver }}</div>
              </n-grid-item>
              <n-grid-item>
                <div class="detail-label">金额</div>
                <div class="detail-value">{{ formatAmount(currentDetail.amount) }}</div>
              </n-grid-item>
              <n-grid-item>
                <div class="detail-label">状态</div>
                <div class="detail-value">{{ renderStatus(currentDetail.status) }}</div>
              </n-grid-item>
            </n-grid>
            <div class="detail-content">
              <div class="detail-label">审批内容</div>
              <div class="detail-text">{{ currentDetail.content }}</div>
            </div>
          </n-card>

          <div class="timeline-section">
            <h3 class="section-title">审批记录</h3>
            <n-timeline>
              <n-timeline-item
                v-for="(item, idx) in currentDetail.timeline"
                :key="idx"
                :type="(idx === currentDetail.timeline.length - 1 ? 'primary' : 'default') as never"
              >
                <div class="timeline-action">{{ item.action }}</div>
                <div class="timeline-meta">{{ item.actor }} · {{ item.time }}</div>
              </n-timeline-item>
            </n-timeline>
          </div>
        </div>

        <template #footer>
          <n-space v-if="currentDetail.status === 'pending' || currentDetail.status === 'processing'" justify="end" :size="12" style="width: 100%">
            <n-button @click="rejectItem(currentDetail.id); closeDrawer()">驳回</n-button>
            <n-button type="primary" @click="approveItem(currentDetail.id); closeDrawer()">通过</n-button>
          </n-space>
          <n-button v-else style="width: 100%" @click="closeDrawer">关闭</n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.approvals-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  margin-bottom: 0;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #6E665B;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 30px;
  font-weight: 600;
  color: #2A261F;
  line-height: 1.2;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.trend-text {
  font-size: 12px;
}

.toolbar-card {
  margin-bottom: 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.table-card {
  min-height: calc(100vh - 360px);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #E8E2D9;
}

.pagination-text {
  font-size: 13px;
  color: #9F968A;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drawer-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #E8E2D9;
}

.applicant-name {
  font-size: 16px;
  font-weight: 600;
  color: #2A261F;
}

.applicant-meta {
  font-size: 12px;
  color: #9F968A;
}

.detail-card {
  background: #F7F4EF;
}

.detail-label {
  font-size: 12px;
  color: #9F968A;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #2A261F;
}

.detail-content {
  margin-top: 16px;
}

.detail-text {
  font-size: 14px;
  line-height: 1.6;
  color: #6E665B;
  margin-top: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #2A261F;
  margin: 0 0 12px 0;
}

.timeline-action {
  font-size: 14px;
  font-weight: 500;
  color: #2A261F;
}

.timeline-meta {
  font-size: 12px;
  color: #9F968A;
  margin-top: 2px;
}
</style>
