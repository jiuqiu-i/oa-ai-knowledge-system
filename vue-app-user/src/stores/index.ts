import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  User,
  Approval,
  ApprovalStats,
  ApprovalType,
  KbCategory,
  KbDoc,
  AiSession,
  AiMessage
} from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User>({
    name: '张宁',
    dept: '产品部',
    email: 'zhangning@company.com',
    avatar: ''
  })
  const isLoggedIn = ref(false)

  const login = (payload: Partial<User>) => {
    if (payload?.name) user.value = { ...user.value, ...payload }
    isLoggedIn.value = true
  }
  const logout = () => {
    isLoggedIn.value = false
  }

  return { user, isLoggedIn, login, logout }
})

export const useApprovalStore = defineStore('approval', () => {
  const approvals = ref<Approval[]>([
    { id: 1, title: '市场部 Q3 预算申请', from: '李经理', time: '2 小时前', type: 'budget', status: 'pending', level: 'urgent' },
    { id: 2, title: '下周产品评审会议程确认', from: '王芳', time: '4 小时前', type: 'meeting', status: 'pending', level: 'warning' },
    { id: 3, title: '本月绩效考核自评', from: '人事行政', time: '截止时间 8 月 20 日', type: 'appraisal', status: 'pending', level: 'info' }
  ])

  const stats = ref<ApprovalStats>({
    pending: 5,
    processing: 2,
    completed: 18
  })

  const pendingCount = computed(() => approvals.value.length)

  interface ApprovalPayload {
    title: string
    type: ApprovalType
    content?: string
    amount?: number | null
  }

  const addApproval = (payload: ApprovalPayload) => {
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

  return { approvals, stats, pendingCount, addApproval }
})

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
    activeCategory,
    keyword,
    sortBy,
    filteredDocs,
    sortedDocs,
    search,
    highlight
  }
})

export const useAiStore = defineStore('ai', () => {
  const sessions = ref<AiSession[]>([
    { id: 1, title: '周报撰写与要点梳理', active: true },
    { id: 2, title: '报销流程咨询', active: false },
    { id: 3, title: '会议纪要总结', active: false },
    { id: 4, title: '请假申请模板', active: false },
    { id: 5, title: '项目进度跟进', active: false },
    { id: 6, title: '入职办理指引', active: false },
    { id: 7, title: 'IT 设备报修', active: false }
  ])

  const messages = ref<AiMessage[]>([
    {
      id: 'm1',
      role: 'user',
      content: '帮我写一份周报，重点体现本周项目进展和下周计划。',
      typing: false
    },
    {
      id: 'm2',
      role: 'assistant',
      content: '好的，请补充以下信息，我会帮你生成周报：\n\n- 本周完成的核心任务\n- 遇到的主要问题或风险\n- 下周计划与需要的支持',
      typing: true
    },
    {
      id: 'm3',
      role: 'user',
      content: '本周完成了知识库原型设计，下周准备进入开发。',
      typing: false
    }
  ])

  const isTyping = ref(false)

  const currentSession = computed<AiSession | undefined>(() => sessions.value.find((s) => s.active))

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    messages.value.push({ id: Date.now().toString(), role: 'user', content: text.trim(), typing: false })
    isTyping.value = true
    setTimeout(() => {
      isTyping.value = false
      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '收到，我会根据你的需求继续协助。如需更具体的输出，请补充相关背景或数据。',
        typing: true
      })
    }, 1500)
  }

  const addQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  const selectSession = (id: number) => {
    sessions.value.forEach((s) => (s.active = s.id === id))
  }

  const createSession = () => {
    sessions.value.forEach((s) => (s.active = false))
    const newSession: AiSession = { id: Date.now(), title: '新对话', active: true }
    sessions.value.unshift(newSession)
    messages.value = []
  }

  return {
    sessions,
    messages,
    isTyping,
    currentSession,
    sendMessage,
    addQuickPrompt,
    selectSession,
    createSession
  }
})
