import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  User,
  Approval,
  ApprovalStats,
  ApprovalType,
  ApprovalLevel,
  KbCategory,
  KbDoc,
  AiSession,
  AiMessage,
  ApiApproval,
  ApiApprovalType,
  ApiApprovalStatus,
  ApiKbDoc,
  ApiHotDoc,
  LoginPayload
} from '@/types'
import {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  agentStream,
  type ConversationVO
} from '@/api/ai'
import { login as apiLogin, getProfile, logout as apiLogout, setAuthToken } from '@/api/auth'
import {
  getMyApprovals,
  getPendingStats,
  createApproval as apiCreateApproval
} from '@/api/approval'
import { getDocList, getHotDocs, getCategories as getKbCategoriesApi } from '@/api/kb'

// ============================================================
// 用户 store：对接 /auth
// ============================================================
export const useUserStore = defineStore('user', () => {
  const user = ref<User>({
    name: '访客',
    dept: '',
    email: '',
    avatar: ''
  })
  const isLoggedIn = ref(false)

  /** 登录：调用后端 /auth/login，写入 token 与用户信息 */
  const login = async (credentials: LoginPayload): Promise<boolean> => {
    try {
      const { data } = await apiLogin(credentials)
      setAuthToken(data.token)
      const u = data.user
      user.value = {
        id: u.id,
        name: u.name,
        dept: u.dept,
        email: u.email,
        avatar: u.avatarColor
      }
      isLoggedIn.value = true
      return true
    } catch {
      return false
    }
  }

  /** 拉取当前用户信息（用于刷新页面后恢复登录态）*/
  const fetchProfile = async (): Promise<void> => {
    try {
      const { data } = await getProfile()
      user.value = {
        id: data.id,
        name: data.name,
        dept: data.dept,
        email: data.email,
        avatar: data.avatarColor
      }
      isLoggedIn.value = true
    } catch {
      isLoggedIn.value = false
    }
  }

  const logout = () => {
    apiLogout()
    user.value = { name: '访客', dept: '', email: '', avatar: '' }
    isLoggedIn.value = false
  }

  return { user, isLoggedIn, login, fetchProfile, logout }
})

// ============================================================
// 审批 store：对接 /approvals（我的申请 / 待处理统计 / 提交）
// ============================================================

/** 视图枚举 -> 后端枚举 */
const mapTypeToApi = (t: ApprovalType): ApiApprovalType => {
  switch (t) {
    case 'leave': return 'leave'
    case 'reimburse': return 'expense'
    case 'purchase': return 'procurement'
    case 'seal': return 'other'
    default: return 'other'
  }
}

/** 后端枚举 -> 视图枚举 */
const mapTypeFromApi = (t: ApiApprovalType): ApprovalType => {
  switch (t) {
    case 'leave': return 'leave'
    case 'expense': return 'reimburse'
    case 'procurement': return 'purchase'
    case 'business_trip': return 'meeting'
    default: return 'other'
  }
}

const mapStatusFromApi = (s: ApiApprovalStatus): Approval['status'] => {
  if (s === 'approved') return 'completed'
  if (s === 'rejected') return 'rejected'
  return 'pending'
}

const urgencyToLevel = (u?: string): ApprovalLevel => {
  if (u === 'high') return 'urgent'
  if (u === 'medium') return 'warning'
  return 'info'
}

const formatApiApproval = (a: ApiApproval): Approval => ({
  id: a.id,
  title: a.title,
  from: a.applicant?.name || '我',
  time: (a.createdAt || '').slice(0, 16).replace('T', ' '),
  type: mapTypeFromApi(a.type),
  status: mapStatusFromApi(a.status),
  level: urgencyToLevel(a.urgency),
  content: a.content,
  amount: a.amount ?? undefined
})

export const useApprovalStore = defineStore('approval', () => {
  // 默认演示数据，后端可达时由 fetchMyApprovals 覆盖
  const approvals = ref<Approval[]>([
    { id: 1, title: '市场部 Q3 预算申请', from: '李经理', time: '2 小时前', type: 'budget', status: 'pending', level: 'urgent' },
    { id: 2, title: '下周产品评审会议程确认', from: '王芳', time: '4 小时前', type: 'meeting', status: 'pending', level: 'warning' },
    { id: 3, title: '本月绩效考核自评', from: '人事行政', time: '截止时间 8 月 20 日', type: 'appraisal', status: 'pending', level: 'info' }
  ])

  const loading = ref(false)

  const stats = ref<ApprovalStats>({
    pending: 5,
    processing: 2,
    completed: 18
  })

  const pendingCount = computed(() => approvals.value.filter((a) => a.status === 'pending').length)

  interface ApprovalPayload {
    title: string
    type: ApprovalType
    content?: string
    amount?: number | null
  }

  /** 拉取我的申请 */
  const fetchMyApprovals = async () => {
    loading.value = true
    try {
      const { data } = await getMyApprovals({ page: 1, pageSize: 20 })
      approvals.value = data.list.map(formatApiApproval)
    } catch {
      // 接口异常时保留现有列表
    } finally {
      loading.value = false
    }
  }

  /** 拉取待处理统计 */
  const fetchStats = async () => {
    try {
      const { data } = await getPendingStats()
      stats.value.pending = data.pendingCount
      // processing/completed 以我的申请列表中的分类计算（后端未直接暴露）
      stats.value.processing = approvals.value.filter((a) => a.status === 'pending' || a.status === 'processing').length
      stats.value.completed = approvals.value.filter((a) => a.status === 'completed').length
    } catch {
      // 静默
    }
  }

  const addApproval = async (payload: ApprovalPayload) => {
    try {
      const { data } = await apiCreateApproval({
        type: mapTypeToApi(payload.type),
        title: payload.title,
        content: payload.content || '',
        amount: payload.amount ?? undefined,
      })
      approvals.value.unshift(formatApiApproval(data))
      stats.value.pending += 1
    } catch {
      // 回退演示模式：本地占位
      approvals.value.unshift({
        id: Date.now(),
        title: payload.title,
        from: '我',
        time: '刚刚',
        type: payload.type,
        status: 'processing',
        level: 'info',
        content: payload.content,
        amount: payload.amount
      })
      stats.value.processing += 1
    }
  }

  return { approvals, loading, stats, pendingCount, fetchMyApprovals, fetchStats, addApproval }
})

// ============================================================
// 知识库 store：对接 /knowledge-base
// 保留原有分类侧边栏（key/label/icon）与前端筛选/排序逻辑，
// 文档数据改为可从后端拉取并映射到视图模型。
// ============================================================

const formatViews = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const formatApiKbDoc = (d: ApiKbDoc | ApiHotDoc): KbDoc => {
  const isFull = 'content' in d
  const full = d as ApiKbDoc
  const created = (full.createdAt || '')
  return {
    id: d.id,
    title: d.title,
    summary: isFull ? (full.summary || '') : '',
    category: d.category,
    tags: isFull ? (full.tags || []) : [],
    author: isFull ? (full.author?.name || '') : '',
    updated: (isFull ? (full.updatedAt || full.createdAt || '') : (d as ApiHotDoc).createdAt || '').slice(0, 10),
    views: formatViews(d.views),
    icon: 'FileText',
    // updatedOrder 越小越靠前（最新）；用时间戳取负值实现
    updatedOrder: -Date.parse(isFull ? (full.createdAt || created) : (d as ApiHotDoc).createdAt) || 0
  }
}

export const useKbStore = defineStore('kb', () => {
  const categories = ref<KbCategory[]>([
    { key: 'all', label: '全部知识', icon: 'FolderOpen' },
    { key: 'product', label: '产品文档', icon: 'Box' },
    { key: 'tech', label: '研发规范', icon: 'Code2' },
    { key: 'sales', label: '销售手册', icon: 'TrendingUp' },
    { key: 'hr', label: '人事制度', icon: 'Users' },
    { key: 'faq', label: '常见问题', icon: 'HelpCircle' }
  ])

  const tags = ref<string[]>(['入职', '技术', '销售', '财务', '产品', 'FAQ', '安全'])

  const docs = ref<KbDoc[]>([
    { id: 1, title: '新员工入职指引', summary: '从入职第一天到转正的全流程说明，包含 IT 申请、制度学习与导师对接。', category: '人事制度', tags: ['入职'], author: '李婷', updated: '2 天前更新', views: '2.4k', icon: 'FileText', updatedOrder: 4 },
    { id: 2, title: '前端研发规范 v2.0', summary: '代码风格、组件约定、分支管理与 Code Review 流程的统一规范。', category: '研发规范', tags: ['前端'], author: '陈浩', updated: '1 周前更新', views: '1.8k', icon: 'Code', updatedOrder: 6 },
    { id: 3, title: 'Q3 产品 Roadmap', summary: '本季度核心功能规划、里程碑节点与跨团队协同事项。', category: '产品文档', tags: ['规划'], author: '王悦', updated: '3 天前更新', views: '1.5k', icon: 'Rocket', updatedOrder: 5 },
    { id: 4, title: '信息安全与保密制度', summary: '数据分级、访问控制、泄密处理与合规审计要求说明。', category: '人事制度', tags: ['安全'], author: '张敏', updated: '5 小时前更新', views: '892', icon: 'ShieldCheck', updatedOrder: 1 },
    { id: 5, title: '费用报销操作手册', summary: '报销标准、发票要求、审批流配置与常见问题答疑。', category: '常见问题', tags: ['财务'], author: '赵琳', updated: '昨天更新', views: '756', icon: 'Banknote', updatedOrder: 2 },
    { id: 6, title: '销售话术与 FAQ', summary: '面向企业客户的开场白、异议处理与竞品对比话术。', category: '销售手册', tags: ['FAQ'], author: '刘洋', updated: '2 天前更新', views: '634', icon: 'Phone', updatedOrder: 3 }
  ])

  const hotDocs = ref<KbDoc[]>([])

  const activeCategory = ref<string>('all')
  const keyword = ref<string>('')
  const sortBy = ref<string>('relevance')

  const parseViews = (str: string): number => {
    const n = parseFloat(String(str).replace(/[^0-9.]/g, ''))
    return String(str).includes('k') ? n * 1000 : n
  }

  const matches = (doc: KbDoc, k: string): boolean => {
    const key = k.toLowerCase()
    return (
      doc.title.toLowerCase().includes(key) ||
      doc.summary.toLowerCase().includes(key) ||
      doc.category.toLowerCase().includes(key) ||
      doc.tags.some((t) => t.toLowerCase().includes(key)) ||
      doc.author.toLowerCase().includes(key)
    )
  }

  const relevanceScore = (doc: KbDoc, k: string): number => {
    const key = k.toLowerCase()
    let score = 0
    if (doc.title.toLowerCase().includes(key)) score += 10
    if (doc.summary.toLowerCase().includes(key)) score += 5
    if (doc.category.toLowerCase().includes(key)) score += 3
    if (doc.tags.some((t) => t.toLowerCase().includes(key))) score += 3
    if (doc.author.toLowerCase().includes(key)) score += 1
    return score
  }

  const filteredDocs = computed<KbDoc[]>(() => {
    let list = docs.value
    if (activeCategory.value !== 'all') {
      const catMap: Record<string, string> = {
        product: '产品文档',
        tech: '研发规范',
        sales: '销售手册',
        hr: '人事制度',
        faq: '常见问题'
      }
      list = list.filter((d) => d.category === catMap[activeCategory.value])
    }
    if (keyword.value.trim()) {
      list = list.filter((d) => matches(d, keyword.value))
    }
    return list
  })

  const sortedDocs = computed<KbDoc[]>(() => {
    const list = [...filteredDocs.value]
    if (sortBy.value === 'latest') {
      list.sort((a, b) => a.updatedOrder - b.updatedOrder)
    } else if (sortBy.value === 'hottest') {
      list.sort((a, b) => parseViews(b.views) - parseViews(a.views))
    } else if (keyword.value.trim()) {
      list.sort((a, b) => relevanceScore(b, keyword.value) - relevanceScore(a, keyword.value))
    }
    return list
  })

  /** 从后端拉取文档列表（保留前端筛选/排序）*/
  const fetchDocs = async (params?: { keyword?: string; category?: string; tag?: string; page?: number; pageSize?: number }) => {
    try {
      const { data } = await getDocList(params)
      docs.value = data.list.map(formatApiKbDoc)
    } catch {
      // 接口异常时保留现有（演示）数据
    }
  }

  /** 从后端拉取热门文档 */
  const fetchHotDocs = async () => {
    try {
      const { data } = await getHotDocs()
      hotDocs.value = data.map(formatApiKbDoc)
    } catch {
      hotDocs.value = []
    }
  }

  /** 从后端拉取分类（合并到侧边栏：保留 'all'，其余按真实分类生成）*/
  const fetchCategories = async () => {
    try {
      const { data } = await getKbCategoriesApi()
      categories.value = [
        { key: 'all', label: '全部知识', icon: 'FolderOpen' },
        ...data.map((c) => ({ key: c, label: c, icon: 'FileText' }))
      ]
    } catch {
      // 保留默认分类
    }
  }

  const search = (k: string) => {
    keyword.value = k
  }

  const highlight = (text: string, k: string): string => {
    if (!k) return text
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(${safe})`, 'gi')
    return text.replace(re, '<mark class="search-highlight">$1</mark>')
  }

  return {
    categories,
    tags,
    docs,
    hotDocs,
    activeCategory,
    keyword,
    sortBy,
    filteredDocs,
    sortedDocs,
    fetchDocs,
    fetchHotDocs,
    fetchCategories,
    search,
    highlight
  }
})

// ============================================================
// AI store：对接 /ai（Agent 流式），保持既有实现
// ============================================================
export const useAiStore = defineStore('ai', () => {
  const sessions = ref<AiSession[]>([])
  const messages = ref<AiMessage[]>([])
  const isTyping = ref(false)

  // 当前会话的 conversationId（后端 UUID）
  const currentConversationId = ref<string | undefined>(undefined)
  // 流式中断控制器（支持停止生成）
  let abortController: AbortController | null = null

  const currentSession = computed<AiSession | undefined>(() =>
    sessions.value.find((s) => s.active),
  )

  /** 加载会话列表 */
  const loadSessions = async () => {
    try {
      const { data } = await getConversations()
      sessions.value = (data as ConversationVO[]).map((s) => ({
        id: s.id,
        title: s.title || '新会话',
        active: false,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    } catch (e) {
      // 未登录或接口异常时静默，保持空列表
      sessions.value = []
    }
  }

  /** 选择会话并加载历史消息 */
  const selectSession = async (id: string) => {
    sessions.value.forEach((s) => (s.active = s.id === id))
    currentConversationId.value = id
    messages.value = []
    try {
      const { data } = await getConversation(id)
      const detail = data as { messages?: Array<{ role: string; content: string; thinkingSteps?: string[] }> }
      if (detail?.messages?.length) {
        messages.value = detail.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m, idx) => ({
            id: `${id}-${idx}`,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            typing: false,
            thinkingSteps: m.thinkingSteps ?? [],
          }))
      }
    } catch {
      // 接口异常时保留空消息列表
    }
  }

  /** 新建会话：先调后端创建，再激活 */
  const createSession = async () => {
    try {
      const { data } = await createConversation('新会话')
      const conv = data as ConversationVO
      sessions.value.forEach((s) => (s.active = false))
      sessions.value.unshift({
        id: conv.id,
        title: conv.title,
        active: true,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })
      currentConversationId.value = conv.id
      messages.value = []
    } catch {
      // 接口异常：本地占位，保证可用性
      sessions.value.forEach((s) => (s.active = false))
      const fallback: AiSession = {
        id: `local-${Date.now()}`,
        title: '新会话',
        active: true,
      }
      sessions.value.unshift(fallback)
      currentConversationId.value = undefined
      messages.value = []
    }
  }

  /** 删除会话 */
  const removeSession = async (id: string) => {
    try {
      await deleteConversation(id)
    } catch {
      // 忽略删除失败
    }
    sessions.value = sessions.value.filter((s) => s.id !== id)
    if (currentConversationId.value === id) {
      currentConversationId.value = undefined
      messages.value = []
    }
  }

  /**
   * 发送消息并接收 Agent 流式回复
   *
   * 流程：
   * 1) 追加 user 消息
   * 2) 若无 conversationId，先创建会话
   * 3) 占位 assistant 消息（streaming=true），逐 token 累积到 content
   * 4) 流式结束后 streaming=false；失败时写入错误提示
   */
  const sendMessage = async (text: string) => {
    const content = text.trim()
    if (!content || isTyping.value) return

    // user 消息立即上屏
    messages.value.push({
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      typing: false,
    })

    // 确保 conversationId
    if (!currentConversationId.value) {
      try {
        const { data } = await createConversation('新会话')
        const conv = data as ConversationVO
        currentConversationId.value = conv.id
        sessions.value.forEach((s) => (s.active = false))
        sessions.value.unshift({
          id: conv.id,
          title: conv.title,
          active: true,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        })
      } catch {
        currentConversationId.value = undefined
      }
    }

    // 占位 assistant 消息
    const assistantId = `a-${Date.now()}`
    messages.value.push({
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
      thinkingSteps: [],
    })
    isTyping.value = true

    abortController = new AbortController()

    await agentStream(
      { message: content, conversationId: currentConversationId.value },
      {
        onThinkingStep: (step) => {
          const msg = messages.value.find((m) => m.id === assistantId)
          if (msg) msg.thinkingSteps!.push(step)
        },
        onToken: (token) => {
          const msg = messages.value.find((m) => m.id === assistantId)
          if (msg) msg.content += token
        },
        onDone: (fullText) => {
          const msg = messages.value.find((m) => m.id === assistantId)
          if (msg) {
            msg.streaming = false
            if (!msg.content && fullText) msg.content = fullText
          }
          isTyping.value = false
          // 更新会话标题（后端首条消息后会重置 title）
          const sess = sessions.value.find((s) => s.id === currentConversationId.value)
          if (sess && (sess.title === '新会话' || !sess.title)) {
            sess.title = content.slice(0, 20)
          }
        },
        onError: (err) => {
          const msg = messages.value.find((m) => m.id === assistantId)
          if (msg) {
            msg.streaming = false
            msg.content = msg.content ||
              '（AI 回复失败，请检查网络或后端服务后重试。详见控制台。）'
          }
          isTyping.value = false
          // eslint-disable-next-line no-console
          console.error('[Agent stream] error:', err)
        },
      },
      abortController.signal,
    )
  }

  /** 中止当前流式生成 */
  const stopStreaming = () => {
    abortController?.abort()
    abortController = null
    isTyping.value = false
    messages.value.forEach((m) => {
      if (m.streaming) m.streaming = false
    })
  }

  const addQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  return {
    sessions,
    messages,
    isTyping,
    currentConversationId,
    currentSession,
    loadSessions,
    sendMessage,
    stopStreaming,
    addQuickPrompt,
    selectSession,
    createSession,
    removeSession,
  }
})
