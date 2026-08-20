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
          <n-card title="我的申请" class="panel-card">
            <template #header-extra>
              <n-space align="center" :size="8">
                <n-tag round size="small">{{ approvalStore.pendingCount }}</n-tag>
                <n-button text type="primary" size="small" @click="refreshApprovals">刷新</n-button>
              </n-space>
            </template>
            <n-empty v-if="!approvalStore.loading && approvalStore.approvals.length === 0" description="暂无申请记录，去发起一个审批吧" size="small" />
            <n-list v-else hoverable clickable>
              <n-list-item v-for="item in approvalStore.approvals" :key="item.id" @click="openApprovalDetail(item)">
                <n-thing>
                  <template #avatar>
                    <span class="status-dot" :style="{ background: levelColor(item.level) }" />
                  </template>
                  <template #header>
                    <n-space align="center" :size="8">
                      <span>{{ item.title }}</span>
                      <n-tag size="tiny" round :type="statusTagType(item.status)" :bordered="false">{{ statusLabel(item.status) }}</n-tag>
                    </n-space>
                  </template>
                  <template #description>{{ item.from }} · {{ item.time }}</template>
                </n-thing>
                <template #suffix>
                  <n-button text type="primary" size="small" @click.stop="openApprovalDetail(item)">查看</n-button>
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
              <n-button text type="primary" @click="goKb">查看全部</n-button>
            </template>
            <n-empty v-if="recentDocs.length === 0" description="暂无文档" size="small" />
            <n-data-table v-else
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
          <n-card title="审批动态" class="panel-card">
            <n-space vertical :size="16">
              <n-empty v-if="approvalTimeline.length === 0" description="暂无动态" size="small" />
              <div v-for="(evt, idx) in approvalTimeline" :key="idx" class="event-row">
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
                </div>
              </div>
            </n-space>
          </n-card>

          <!-- Team feed -->
          <n-card title="文档动态" class="panel-card">
            <n-space vertical :size="16">
              <n-empty v-if="docFeeds.length === 0" description="暂无文档更新" size="small" />
              <div v-for="feed in docFeeds" :key="feed.id" class="feed-row">
                <n-avatar round size="small" :style="{ background: 'var(--oak-primary)', color: '#fff' }">
                  {{ feed.avatar }}
                </n-avatar>
                <div>
                  <p class="oak-body">
                    <span style="font-weight: 500;">{{ feed.user }}</span> {{ feed.action }}
                    <n-button text type="primary" size="tiny" @click="goKb">{{ feed.target }}</n-button>
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
        <n-form-item label="所属分类" path="space">
          <n-select v-model:value="docForm.space" :options="computedDocSpaceOptions" />
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

    <!-- Approval detail drawer -->
    <n-drawer v-model:show="detailVisible" :width="460" placement="right">
      <n-drawer-content v-if="currentApproval" title="申请详情" closable>
        <div class="drawer-body">
          <n-space vertical :size="16">
            <div>
              <div class="drawer-label">审批标题</div>
              <div class="drawer-value" style="font-weight:600;font-size:16px;">{{ currentApproval.title }}</div>
            </div>
            <n-grid :cols="2" :x-gap="16">
              <n-grid-item>
                <div class="drawer-label">申请类型</div>
                <div class="drawer-value">{{ approvalTypeLabelMap[currentApproval.type] || currentApproval.type }}</div>
              </n-grid-item>
              <n-grid-item>
                <div class="drawer-label">当前状态</div>
                <div class="drawer-value">
                  <n-tag round :type="statusTagType(currentApproval.status)" :bordered="false">{{ statusLabel(currentApproval.status) }}</n-tag>
                </div>
              </n-grid-item>
              <n-grid-item v-if="currentApproval.amount != null && currentApproval.amount !== undefined">
                <div class="drawer-label">金额</div>
                <div class="drawer-value">¥ {{ Number(currentApproval.amount).toLocaleString('zh-CN') }}</div>
              </n-grid-item>
              <n-grid-item>
                <div class="drawer-label">申请人 / 时间</div>
                <div class="drawer-value">{{ currentApproval.from }} · {{ currentApproval.time }}</div>
              </n-grid-item>
            </n-grid>
            <div>
              <div class="drawer-label">审批内容</div>
              <div class="drawer-value content-box">{{ currentApproval.content || '（未填写）' }}</div>
            </div>
          </n-space>
        </div>
      </n-drawer-content>
    </n-drawer>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type {
  FormInst,
  FormRules,
  FormItemRule,
  FormValidationError,
  DataTableColumns,
  TagProps
} from 'naive-ui'
import {
  NCard, NSpace, NButton, NGrid, NGridItem, NList, NListItem,
  NThing, NTag, NDataTable, NModal, NForm, NFormItem, NInput,
  NSelect, NInputNumber, NAvatar, NDrawer, NDrawerContent, NEmpty
} from 'naive-ui'
import {
  FilePlus, FileText, Sparkles, Clock, Loader2, Check,
  BookOpen
} from 'lucide-vue-next'
import { useUserStore, useApprovalStore, useKbStore } from '@/stores'
import { createDoc } from '@/api/kb'
import type { Component } from 'vue'
import type { Approval, ApprovalType, ApprovalStatus } from '@/types'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const approvalStore = useApprovalStore()
const kbStore = useKbStore()

const goAi = () => router.push('/ai')
const goKb = () => router.push('/kb')

// 进入首页时尝试恢复登录态并拉取我的审批与知识库数据
onMounted(async () => {
  await userStore.fetchProfile()
  await Promise.all([
    approvalStore.fetchMyApprovals(),
    approvalStore.fetchStats(),
    kbStore.fetchCategories(),
    kbStore.fetchHotDocs(),
    kbStore.fetchDocs({ pageSize: 5 }),
  ])
})

const refreshApprovals = async () => {
  await approvalStore.fetchMyApprovals()
  await approvalStore.fetchStats()
  message.success('已刷新')
}

const today = new Date()
const todayText = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`
const hour = today.getHours()
const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

const levelColor = (level: string): string => {
  const map: Record<string, string> = { error: '#EA4335', warning: '#F5B800', urgent: '#EA4335', info: '#2E90FA' }
  return map[level] || '#9F968A'
}

const statusLabel = (s: ApprovalStatus): string => {
  const map: Record<ApprovalStatus, string> = { pending: '待审批', processing: '审批中', completed: '已通过', rejected: '已驳回' }
  return map[s] || s
}
const statusTagType = (s: ApprovalStatus): TagProps['type'] => {
  const map: Record<ApprovalStatus, TagProps['type']> = {
    pending: 'warning', processing: 'info', completed: 'success', rejected: 'error'
  }
  return map[s] || 'default'
}

const approvalTypeLabelMap: Record<ApprovalType, string> = {
  leave: '请假', reimburse: '报销', purchase: '采购', seal: '用印',
  budget: '预算', meeting: '会议', appraisal: '绩效', other: '其他'
}

interface ApprovalStatItem {
  label: string
  value: number
  hint: string
  icon: Component
}

const approvalStatList = computed<ApprovalStatItem[]>(() => [
  { label: '待处理', value: approvalStore.stats.pending, hint: '待我处理或审批中', icon: Clock },
  { label: '审批中', value: approvalStore.stats.processing, hint: '流程进行中', icon: Loader2 },
  { label: '已完成', value: approvalStore.stats.completed, hint: '历史已办结', icon: Check }
])

interface RecentDoc {
  name: string
  space: string
  updated: string
}

const recentDocs = computed<RecentDoc[]>(() => {
  if (kbStore.docs.length > 0) {
    return kbStore.docs.slice(0, 5).map((d) => ({
      name: d.title,
      space: d.category,
      updated: d.updated
    }))
  }
  return []
})

const docColumns: DataTableColumns<RecentDoc> = [
  { title: '文档名称', key: 'name' },
  { title: '所在空间', key: 'space' },
  { title: '更新时间', key: 'updated' }
]

interface KbRecommendation {
  title: string
  meta: string
}

const kbRecommendations = computed<KbRecommendation[]>(() => {
  if (kbStore.hotDocs.length > 0) {
    return kbStore.hotDocs.slice(0, 3).map((d) => ({
      title: d.title,
      meta: `${d.category} · ${d.views} 次阅读`
    }))
  }
  return []
})

// ---------- 审批动态：基于我的审批真实数据生成 ----------
interface TimelineEvent {
  month: string
  day: string
  title: string
  time: string
  location: string
}

const parseApprovalTime = (time: string): Date => {
  // 支持 'YYYY-MM-DD HH:mm' 或 '2 小时前' 等格式
  if (time.includes('-') || time.includes('T')) {
    return new Date(time.replace(' ', 'T'))
  }
  return new Date()
}

const approvalTimeline = computed<TimelineEvent[]>(() => {
  const list = [...approvalStore.approvals].slice(0, 4)
  if (list.length === 0) return []
  return list.map((a) => {
    const d = parseApprovalTime(a.time)
    const monthStr = `${d.getMonth() + 1} 月`
    const dayStr = String(d.getDate())
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return {
      month: monthStr,
      day: dayStr,
      title: `【${statusLabel(a.status)}】${a.title}`,
      time: hm,
      location: `${a.from} · 类型：${approvalTypeLabelMap[a.type] || a.type}`
    }
  })
})

// ---------- 文档动态：基于知识库文档数据生成 ----------
interface DocFeed {
  id: string | number
  avatar: string
  user: string
  action: string
  target: string
  time: string
}

const docFeeds = computed<DocFeed[]>(() => {
  const list = kbStore.docs.length > 0 ? kbStore.docs : kbStore.hotDocs
  return list.slice(0, 4).map((d) => ({
    id: d.id,
    avatar: (d.author || '知').charAt(0),
    user: d.author || '知识库',
    action: '更新了文档',
    target: d.title,
    time: d.updated
  }))
})

// ---------- 审批详情抽屉 ----------
const detailVisible = ref(false)
const currentApproval = ref<Approval | null>(null)
const openApprovalDetail = (item: Approval) => {
  currentApproval.value = item
  detailVisible.value = true
}

// ---------- 发起审批 Modal ----------
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
  approvalFormRef.value?.validate(async (errors?: FormValidationError[]) => {
    if (errors) return
    try {
      await approvalStore.addApproval(approvalForm.value)
      message.success('审批已提交')
      approvalVisible.value = false
      // 提交后刷新列表和统计
      await approvalStore.fetchMyApprovals()
      await approvalStore.fetchStats()
    } catch (e) {
      message.error('提交失败，请检查网络或后端服务')
    }
  })
}

// ---------- 新建文档 Modal ----------
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

// 文档空间选项来源于后端分类（若无分类则回退到默认选项）
const computedDocSpaceOptions = computed(() => {
  const fromStore = (kbStore.categories || []).filter((c) => c.key !== 'all').map((c) => ({ label: c.label, value: c.key }))
  if (fromStore.length > 0) return fromStore
  return docSpaceOptions
})

const openDocModal = () => {
  const opts = computedDocSpaceOptions.value
  docForm.value = { title: '', space: opts[0]?.value || 'product', docType: 'doc' }
  docVisible.value = true
}

const submitDoc = () => {
  docFormRef.value?.validate(async (errors?: FormValidationError[]) => {
    if (errors) return
    try {
      const opts = computedDocSpaceOptions.value
      const category = opts.find((o) => o.value === docForm.value.space)?.label || docForm.value.space
      await createDoc({
        title: docForm.value.title,
        category,
        content: '',
      })
      message.success(`文档「${docForm.value.title}」创建成功`)
      docVisible.value = false
      // 创建后刷新文档列表和推荐
      await kbStore.fetchDocs({ pageSize: 5 })
      await kbStore.fetchHotDocs()
    } catch {
      message.error('文档创建失败，请检查网络或后端服务')
    }
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
.feed-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.mt-1 { margin-top: 4px; }
.drawer-body {
  padding: 8px 4px 16px;
}
.drawer-label {
  font-size: 12px;
  color: var(--oak-ink-3);
  margin-bottom: 4px;
}
.drawer-value {
  font-size: 14px;
  color: var(--oak-ink);
  line-height: 1.6;
}
.content-box {
  background: var(--oak-surface-2);
  border-radius: 8px;
  padding: 12px;
  white-space: pre-wrap;
}
</style>
