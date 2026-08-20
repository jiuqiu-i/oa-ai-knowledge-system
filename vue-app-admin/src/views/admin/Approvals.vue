<script setup lang="ts">
import { ref, computed, h, onMounted, watch, nextTick } from 'vue'
import type { Component } from 'vue'
import type { DataTableColumns, SelectOption, FormInst, FormRules, FormItemRule } from 'naive-ui'
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
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NEmpty,
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
  Minus,
  RefreshCw
} from 'lucide-vue-next'
import type { Approval, ApprovalStatus, ApprovalType } from '@/types'
import { useApprovalStore } from '@/stores'

const message = useMessage()
const approvalStore = useApprovalStore()

// ---------- 拉取真实数据 ----------
const searchKeyword = ref('')
const typeFilter = ref<string>('')
const statusFilter = ref<string>('')
const page = ref(1)
const pageSize = ref(10)

onMounted(() => {
  fetchFromApi()
})

// 搜索/筛选/分页变化 -> 重新调后端
watch([searchKeyword, typeFilter, statusFilter, page, pageSize], () => {
  fetchFromApi()
})

function fetchFromApi() {
  const params: Record<string, unknown> = {
    page: page.value,
    pageSize: pageSize.value
  }
  if (searchKeyword.value.trim()) params.keyword = searchKeyword.value.trim()
  // 视图枚举 -> 后端枚举（type）
  if (typeFilter.value) {
    const typeMap: Record<string, string> = { leave: 'leave', reimburse: 'expense', purchase: 'procurement', seal: 'business_trip' }
    params.type = typeMap[typeFilter.value] || typeFilter.value
  }
  // 后端目前只有 pending/approved/rejected，视图里的 processing 也作为 pending 查
  if (statusFilter.value) {
    params.status = statusFilter.value === 'processing' ? 'pending' : statusFilter.value
  }
  approvalStore.fetchApprovals(params)
}

function resetAndFetch() {
  page.value = 1
  fetchFromApi()
}

// ---------- 选项 ----------
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

// ---------- 统计卡片（用 store 真实数据）----------
interface StatCard {
  label: string
  value: number
  trend: string
  trendType: 'up' | 'down' | 'flat'
  icon: Component
  color: string
}

// 用 computed 动态获取 store 中已计算好的各状态 count，同时 total 作为参考
const stats = computed<StatCard[]>(() => [
  { label: '待审批', value: approvalStore.pendingCount, trend: '实时', trendType: 'flat', icon: Clock, color: '#F5B800' },
  { label: '审批中', value: approvalStore.processingCount, trend: '实时', trendType: 'flat', icon: Loader, color: '#2E90FA' },
  { label: '已通过', value: approvalStore.approvedCount, trend: '实时', trendType: 'flat', icon: CheckCircle, color: '#34A853' },
  { label: '已驳回', value: approvalStore.rejectedCount, trend: '实时', trendType: 'flat', icon: XCircle, color: '#EA4335' }
])

// ---------- 列表（直接用 store.approvals）----------
const tableData = computed<Approval[]>(() => approvalStore.approvals)
const total = computed<number>(() => approvalStore.total || approvalStore.approvals.length)

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
  { title: '类型', key: 'type', render: (row) => typeMap[row.type] || row.type },
  { title: '金额', key: 'amount', render: (row) => formatAmount(row.amount) },
  { title: '提交时间', key: 'submitTime' },
  { title: '当前审批人', key: 'approver', render: (row) => row.approver || '—' },
  { title: '状态', key: 'status', render: (row) => renderStatus(row.status) },
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

// ---------- 详情 Drawer ----------
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
  if (currentDetail.value?.id === id) closeDrawer()
}

async function rejectItem(id: number | string) {
  const item = approvalStore.getApprovalById(id)
  await approvalStore.rejectItem(id)
  message.error(`「${item?.title ?? ''}」已驳回`)
  if (currentDetail.value?.id === id) closeDrawer()
}

async function deleteItem(id: number | string) {
  const item = approvalStore.getApprovalById(id)
  await approvalStore.deleteItem(id)
  message.info(`已删除「${item?.title ?? ''}」`)
  if (currentDetail.value?.id === id) closeDrawer()
}

// ---------- 发起审批 Modal ----------
const showCreateModal = ref(false)
const createFormRef = ref<FormInst | null>(null)
const createForm = ref<{ title: string; type: ApprovalType; content: string; amount: number | null }>({
  title: '', type: 'leave', content: '', amount: null
})

const createRules: FormRules = {
  title: { required: true, message: '请输入审批标题', trigger: 'blur' } as FormItemRule,
  type: { required: true, message: '请选择审批类型', trigger: 'change' } as FormItemRule,
  content: { required: true, message: '请输入审批内容', trigger: 'blur' } as FormItemRule
}

const createTypeOptions = [
  { label: '请假', value: 'leave' as ApprovalType },
  { label: '报销', value: 'reimburse' as ApprovalType },
  { label: '采购', value: 'purchase' as ApprovalType },
  { label: '用印', value: 'seal' as ApprovalType }
]

const showAmountInForm = computed(() => ['reimburse', 'purchase'].includes(createForm.value.type))

function openCreateModal() {
  createForm.value = { title: '', type: 'leave', content: '', amount: null }
  showCreateModal.value = true
}

async function submitCreate() {
  const errors = await new Promise<unknown>((resolve) => createFormRef.value?.validate(resolve))
  if (errors) return
  await approvalStore.createItem(createForm.value)
  message.success('审批已创建')
  showCreateModal.value = false
  nextTick(() => resetAndFetch())
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
              {{ stat.trend }}
            </span>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- Toolbar -->
    <n-card class="toolbar-card">
      <n-space justify="space-between" align="center" wrap>
        <n-space wrap>
          <n-input v-model:value="searchKeyword" placeholder="按标题/申请人搜索..." style="width: 280px" clearable @keyup.enter="resetAndFetch">
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>
          <n-select v-model:value="typeFilter" :options="typeOptions" style="width: 140px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" style="width: 140px" />
          <n-button quaternary @click="resetAndFetch">
            <template #icon><RefreshCw :size="16" /></template>
            刷新
          </n-button>
        </n-space>
        <n-button type="primary" @click="openCreateModal">
          <template #icon>
            <Plus :size="16" />
          </template>
          发起审批
        </n-button>
      </n-space>
    </n-card>

    <!-- Approval table -->
    <n-card class="table-card">
      <n-empty v-if="!approvalStore.loading && tableData.length === 0" description="暂无审批记录，点击右上角「发起审批」创建" />
      <n-data-table
        v-else
        :columns="columns"
        :data="tableData"
        :bordered="false"
        :single-line="false"
        size="small"
        :loading="approvalStore.loading"
        remote
      />
      <div class="pagination-bar">
        <span class="pagination-text">共 {{ total }} 条，每页 {{ pageSize }} 条</span>
        <n-pagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 50]"
          show-size-picker
        />
      </div>
    </n-card>

    <!-- Create approval modal -->
    <n-modal v-model:show="showCreateModal" preset="card" title="发起审批" style="width: 520px; max-width: 90vw;">
      <n-form ref="createFormRef" :model="createForm" :rules="createRules" label-placement="top">
        <n-form-item label="审批标题" path="title">
          <n-input v-model:value="createForm.title" placeholder="请输入审批标题" />
        </n-form-item>
        <n-form-item label="审批类型" path="type">
          <n-select v-model:value="createForm.type" :options="createTypeOptions" />
        </n-form-item>
        <n-form-item label="审批内容" path="content">
          <n-input v-model:value="createForm.content" type="textarea" :rows="4" placeholder="请输入审批内容说明" />
        </n-form-item>
        <n-form-item v-if="showAmountInForm" label="金额（元）">
          <n-input-number v-model:value="createForm.amount" :min="0" :precision="2" placeholder="请输入金额（可选）" style="width: 100%;" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="submitCreate">提交</n-button>
        </n-space>
      </template>
    </n-modal>

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
              {{ currentDetail.applicant ? currentDetail.applicant.charAt(0) : '?' }}
            </n-avatar>
            <div>
              <div class="applicant-name">{{ currentDetail.applicant || '未知' }}</div>
              <div class="applicant-meta">提交于 {{ currentDetail.submitTime }}</div>
            </div>
          </n-space>

          <n-card class="detail-card" :bordered="true" size="small">
            <n-grid :cols="2" :x-gap="16" :y-gap="12">
              <n-grid-item>
                <div class="detail-label">审批类型</div>
                <div class="detail-value">{{ typeMap[currentDetail.type] || currentDetail.type }}</div>
              </n-grid-item>
              <n-grid-item>
                <div class="detail-label">当前审批人</div>
                <div class="detail-value">{{ currentDetail.approver || '—' }}</div>
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
              <div class="detail-text">{{ currentDetail.content || '（未填写内容）' }}</div>
            </div>
          </n-card>

          <div class="timeline-section">
            <h3 class="section-title">审批记录</h3>
            <n-empty v-if="!currentDetail.timeline || currentDetail.timeline.length === 0" description="暂无审批轨迹" size="small" />
            <n-timeline v-else>
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
  white-space: pre-wrap;
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
