<template>
  <main class="home-main">
    <!-- Welcome banner -->
    <n-card class="welcome-card" :bordered="true">
      <div class="welcome-row">
        <div>
          <h1 class="oak-h1">{{ greeting }}，{{ userStore.user.name }}</h1>
          <p class="oak-body-large mt-1">今天是 {{ todayText }}，你目前有 {{ approvalStore.pendingCount }} 项待办事项等待处理。</p>
        </div>
        <n-space :size="12" wrap>
          <n-button type="primary" @click="openApprovalModal">
            <template #icon><FilePlus :size="16" /></template>
            发起审批
          </n-button>
          <n-button @click="openDocModal">
            <template #icon><FileText :size="16" /></template>
            新建文档
          </n-button>
          <n-button @click="goAi">
            <template #icon><Sparkles :size="16" /></template>
            打开 AI 助手
          </n-button>
        </n-space>
      </div>
    </n-card>

    <!-- Dashboard grid -->
    <n-grid cols="1 l:3" :x-gap="24" :y-gap="24" responsive="screen" class="dashboard-grid">
      <!-- Left column -->
      <n-grid-item span="1 l:2" class="left-col">
        <n-space vertical :size="24">
          <!-- Todo -->
          <n-card title="待办事项" class="panel-card">
            <template #header-extra>
              <n-tag round size="small">{{ approvalStore.pendingCount }}</n-tag>
            </template>
            <n-list hoverable clickable>
              <n-list-item v-for="item in approvalStore.approvals" :key="item.id">
                <n-thing>
                  <template #avatar>
                    <span class="status-dot" :style="{ background: levelColor(item.level) }" />
                  </template>
                  <template #header>{{ item.title }}</template>
                  <template #description>{{ item.from }} · {{ item.time }}</template>
                </n-thing>
                <template #suffix>
                  <n-button text type="primary">处理</n-button>
                </template>
              </n-list-item>
            </n-list>
          </n-card>

          <!-- Approval stats -->
          <n-card title="我的审批" class="panel-card">
            <n-grid cols="1 s:3" :x-gap="16" :y-gap="16" responsive="screen">
              <n-grid-item v-for="s in approvalStatList" :key="s.label">
                <div class="stat-box">
                  <n-space align="center" :size="6">
                    <component :is="s.icon" :size="16" />
                    <span class="oak-body">{{ s.label }}</span>
                  </n-space>
                  <div class="stat-value">{{ s.value }}</div>
                  <p class="oak-caption mt-1">{{ s.hint }}</p>
                </div>
              </n-grid-item>
            </n-grid>
          </n-card>

          <!-- Recent docs -->
          <n-card title="最近文档" class="panel-card">
            <template #header-extra>
              <n-button text type="primary">查看全部</n-button>
            </template>
            <n-data-table
              :columns="docColumns"
              :data="recentDocs"
              :bordered="false"
              :single-line="false"
              size="small"
            />
          </n-card>
        </n-space>
      </n-grid-item>

      <!-- Right column -->
      <n-grid-item span="1 l:1" class="right-col">
        <n-space vertical :size="24">
          <!-- Knowledge recommendations -->
          <n-card title="知识推荐" class="panel-card">
            <n-space vertical :size="12">
              <n-card
                v-for="item in kbRecommendations"
                :key="item.title"
                size="small"
                hoverable
                class="rec-card"
              >
                <n-space align="center" :size="8">
                  <BookOpen :size="16" class="primary-text" />
                  <span class="oak-body" style="font-weight: 500;">{{ item.title }}</span>
                </n-space>
                <p class="oak-caption mt-1">{{ item.meta }}</p>
              </n-card>
            </n-space>
          </n-card>

          <!-- Schedule -->
          <n-card title="日程 / 会议" class="panel-card">
            <n-space vertical :size="16">
              <div v-for="(evt, idx) in events" :key="idx" class="event-row">
                <div
                  class="event-date"
                  :class="{ 'event-date-primary': idx === 0 }"
                >
                  <span class="month">{{ evt.month }}</span>
                  <span class="day">{{ evt.day }}</span>
                </div>
                <div class="event-body">
                  <p class="oak-body" style="font-weight: 500;">{{ evt.title }}</p>
                  <p class="oak-caption">{{ evt.time }} · {{ evt.location }}</p>
                  <n-space v-if="evt.members" :size="4" class="members">
                    <n-avatar
                      v-for="m in evt.members"
                      :key="m"
                      round
                      size="small"
                      :style="{ background: 'var(--oak-muted)', color: 'var(--oak-ink-2)' }"
                    >
                      {{ m }}
                    </n-avatar>
                  </n-space>
                </div>
              </div>
            </n-space>
          </n-card>

          <!-- Team feed -->
          <n-card title="团队动态" class="panel-card">
            <n-space vertical :size="16">
              <div v-for="feed in teamFeeds" :key="feed.id" class="feed-row">
                <n-avatar round size="small" :style="{ background: 'var(--oak-muted)', color: 'var(--oak-ink-2)' }">
                  {{ feed.avatar }}
                </n-avatar>
                <div>
                  <p class="oak-body">
                    <span style="font-weight: 500;">{{ feed.user }}</span> {{ feed.action }}
                    <n-button text type="primary" size="tiny">{{ feed.target }}</n-button>
                  </p>
                  <p class="oak-caption">{{ feed.time }}</p>
                </div>
              </div>
            </n-space>
          </n-card>
        </n-space>
      </n-grid-item>
    </n-grid>

    <!-- Approval modal -->
    <n-modal v-model:show="approvalVisible" preset="card" title="发起审批" style="width: 420px; max-width: 90vw;">
      <n-form ref="approvalFormRef" :model="approvalForm" :rules="approvalRules" label-placement="top">
        <n-form-item label="审批标题" path="title">
          <n-input v-model:value="approvalForm.title" placeholder="请输入审批标题" />
        </n-form-item>
        <n-form-item label="审批类型" path="type">
          <n-select v-model:value="approvalForm.type" :options="approvalTypeOptions" />
        </n-form-item>
        <n-form-item label="审批内容" path="content">
          <n-input v-model:value="approvalForm.content" type="textarea" :rows="4" placeholder="请输入审批内容" />
        </n-form-item>
        <n-form-item v-if="showAmount" label="金额（元）" path="amount">
          <n-input-number v-model:value="approvalForm.amount" :min="0" :precision="2" placeholder="请输入金额" style="width: 100%;" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="approvalVisible = false">取消</n-button>
          <n-button type="primary" @click="submitApproval">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- New doc modal -->
    <n-modal v-model:show="docVisible" preset="card" title="新建文档" style="width: 420px; max-width: 90vw;">
      <n-form ref="docFormRef" :model="docForm" :rules="docRules" label-placement="top">
        <n-form-item label="文档标题" path="title">
          <n-input v-model:value="docForm.title" placeholder="请输入文档标题" />
        </n-form-item>
        <n-form-item label="所属空间" path="space">
          <n-select v-model:value="docForm.space" :options="docSpaceOptions" />
        </n-form-item>
        <n-form-item label="文档类型" path="docType">
          <n-select v-model:value="docForm.docType" :options="docTypeOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="docVisible = false">取消</n-button>
          <n-button type="primary" @click="submitDoc">创建</n-button>
        </n-space>
      </template>
    </n-modal>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type {
  FormInst,
  FormRules,
  FormItemRule,
  FormValidationError,
  DataTableColumns
} from 'naive-ui'
import {
  NCard, NSpace, NButton, NGrid, NGridItem, NList, NListItem,
  NThing, NTag, NDataTable, NModal, NForm, NFormItem, NInput,
  NSelect, NInputNumber, NAvatar
} from 'naive-ui'
import {
  FilePlus, FileText, Sparkles, Clock, Loader2, Check,
  BookOpen
} from 'lucide-vue-next'
import { useUserStore, useApprovalStore } from '@/stores'
import type { Component } from 'vue'
import type { ApprovalType } from '@/types'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const approvalStore = useApprovalStore()

const goAi = () => router.push('/ai')

const today = new Date()
const todayText = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`
const hour = today.getHours()
const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

const levelColor = (level: string): string => {
  const map: Record<string, string> = { error: '#EA4335', warning: '#F5B800', info: '#2E90FA' }
  return map[level] || '#9F968A'
}

interface ApprovalStatItem {
  label: string
  value: number
  hint: string
  icon: Component
}

const approvalStatList = computed<ApprovalStatItem[]>(() => [
  { label: '待我审批', value: approvalStore.stats.pending, hint: '较昨日 +1', icon: Clock },
  { label: '审批中', value: approvalStore.stats.processing, hint: '平均 1.5 天', icon: Loader2 },
  { label: '本月已审批', value: approvalStore.stats.completed, hint: '全部准时', icon: Check }
])

interface RecentDoc {
  name: string
  space: string
  updated: string
}

const recentDocs: RecentDoc[] = [
  { name: '项目周报 2026-W33', space: '产品知识库', updated: '昨天 18:20' },
  { name: 'Q3 销售数据看板', space: '销售部门', updated: '8 月 14 日' },
  { name: 'API 接口规范 v2.1', space: '技术研发', updated: '8 月 12 日' }
]

const docColumns: DataTableColumns<RecentDoc> = [
  { title: '文档名称', key: 'name' },
  { title: '所在空间', key: 'space' },
  { title: '更新时间', key: 'updated' }
]

interface KbRecommendation {
  title: string
  meta: string
}

const kbRecommendations: KbRecommendation[] = [
  { title: '新员工入职指南', meta: '人事行政 · 128 次阅读' },
  { title: '高效会议记录模板', meta: '效率办公 · 86 次阅读' },
  { title: '费用报销流程说明', meta: '财务制度 · 204 次阅读' }
]

interface CalendarEvent {
  month: string
  day: string
  title: string
  time: string
  location: string
  members?: string[]
}

const events: CalendarEvent[] = [
  { month: '8 月', day: '16', title: '产品周会', time: '14:00 - 15:00', location: '线上', members: ['张', '李', '+3'] },
  { month: '8 月', day: '17', title: '月度复盘会', time: '10:00 - 12:00', location: '会议室 A' }
]

interface TeamFeed {
  id: number
  avatar: string
  user: string
  action: string
  target: string
  time: string
}

const teamFeeds: TeamFeed[] = [
  { id: 1, avatar: '王', user: '王芳', action: '更新了', target: '客户需求文档', time: '30 分钟前' },
  { id: 2, avatar: '陈', user: '陈晨', action: '完成了合同审批', target: '', time: '1 小时前' },
  { id: 3, avatar: '李', user: '李经理', action: '在知识库发布了', target: 'Q3 战略目标解读', time: '3 小时前' }
]

// Approval modal
interface ApprovalForm {
  title: string
  type: ApprovalType
  content: string
  amount: number | null
}

const approvalVisible = ref(false)
const approvalFormRef = ref<FormInst | null>(null)
const approvalForm = ref<ApprovalForm>({ title: '', type: 'leave', content: '', amount: null })
const approvalRules: FormRules = {
  title: { required: true, message: '请输入审批标题', trigger: 'blur' } as FormItemRule,
  type: { required: true, message: '请选择审批类型', trigger: 'change' } as FormItemRule,
  content: { required: true, message: '请输入审批内容', trigger: 'blur' } as FormItemRule
}
const approvalTypeOptions = [
  { label: '请假', value: 'leave' },
  { label: '报销', value: 'reimburse' },
  { label: '采购', value: 'purchase' },
  { label: '用印', value: 'seal' },
  { label: '其他', value: 'other' }
]
const showAmount = computed(() => ['reimburse', 'purchase'].includes(approvalForm.value.type))

const openApprovalModal = () => {
  approvalForm.value = { title: '', type: 'leave', content: '', amount: null }
  approvalVisible.value = true
}

const submitApproval = () => {
  approvalFormRef.value?.validate((errors?: FormValidationError[]) => {
    if (errors) return
    approvalStore.addApproval(approvalForm.value)
    message.success('审批已提交')
    approvalVisible.value = false
  })
}

// Doc modal
interface DocForm {
  title: string
  space: string
  docType: string
}

const docVisible = ref(false)
const docFormRef = ref<FormInst | null>(null)
const docForm = ref<DocForm>({ title: '', space: 'product', docType: 'doc' })
const docRules: FormRules = {
  title: { required: true, message: '请输入文档标题', trigger: 'blur' } as FormItemRule
}
const docSpaceOptions = [
  { label: '产品知识库', value: 'product' },
  { label: '销售部门', value: 'sales' },
  { label: '技术研发', value: 'tech' },
  { label: '人事行政', value: 'hr' }
]
const docTypeOptions = [
  { label: '文档', value: 'doc' },
  { label: '表格', value: 'sheet' },
  { label: '幻灯片', value: 'slide' }
]

const openDocModal = () => {
  docForm.value = { title: '', space: 'product', docType: 'doc' }
  docVisible.value = true
}

const submitDoc = () => {
  docFormRef.value?.validate((errors?: FormValidationError[]) => {
    if (errors) return
    message.success(`文档「${docForm.value.title}」创建成功`)
    docVisible.value = false
  })
}
</script>

<style scoped>
.home-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}
.welcome-card {
  border-radius: 12px;
  border-left: 4px solid var(--oak-primary);
  background: var(--oak-surface-2);
  margin-bottom: 24px;
}
.welcome-row {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
@media (min-width: 768px) {
  .welcome-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
.dashboard-grid {
  margin-top: 0;
}
.panel-card {
  border: 1px solid var(--oak-line);
  border-radius: 12px;
  background: var(--oak-card);
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 8px;
}
.stat-box {
  padding: 16px;
  border-radius: 8px;
  background: var(--oak-surface-2);
}
.stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  color: var(--oak-ink);
}
.primary-text {
  color: var(--oak-primary);
}
.rec-card {
  border: 1px solid var(--oak-line);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.rec-card:hover {
  border-color: rgba(229, 138, 46, 0.4);
  background: var(--oak-muted);
}
.event-row {
  display: flex;
  gap: 16px;
}
.event-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--oak-surface-2);
  color: var(--oak-ink-2);
  flex-shrink: 0;
}
.event-date-primary {
  background: rgba(229, 138, 46, 0.1);
  color: var(--oak-primary);
}
.event-date .month {
  font-size: 11px;
  font-weight: 500;
}
.event-date .day {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}
.event-body {
  min-width: 0;
  flex: 1;
}
.members {
  margin-top: 8px;
}
.feed-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.mt-1 { margin-top: 4px; }
</style>
