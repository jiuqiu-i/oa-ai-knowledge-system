import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Approval, ApprovalStatus, ApprovalType, ApprovalTimeline } from '@/types'
import {
  getApprovalList,
  approveApproval,
  rejectApproval,
  deleteApproval,
  createApproval as apiCreateApproval
} from '@/api/approval'
import type { ApiApproval, ApprovalQueryParams, CreateApprovalPayload, ApiApprovalType } from '@/types'

/**
 * 视图模型 <-> 后端实体映射
 * 视图模型 Approval 含 applicant/submitTime/approver/timeline；后端 ApiApproval 含 applicantId/createdAt/applicant
 */

const typeApiToView = (t: ApiApproval['type']): ApprovalType => {
  switch (t) {
    case 'leave': return 'leave'
    case 'expense': return 'reimburse'
    case 'procurement': return 'purchase'
    case 'business_trip': return 'seal'
    default: return 'seal'
  }
}

const typeViewToApi = (t: ApprovalType): ApiApprovalType => {
  switch (t) {
    case 'leave': return 'leave'
    case 'reimburse': return 'expense'
    case 'purchase': return 'procurement'
    case 'seal': return 'business_trip'
    default: return 'other'
  }
}

const statusApiToView = (s: ApiApproval['status']): ApprovalStatus => {
  if (s === 'approved') return 'approved'
  if (s === 'rejected') return 'rejected'
  return 'pending'
}

const formatApiToView = (a: ApiApproval): Approval => ({
  id: a.id,
  title: a.title,
  applicant: a.applicant?.name || '未知',
  type: typeApiToView(a.type),
  amount: a.amount,
  submitTime: (a.createdAt || '').slice(0, 16).replace('T', ' '),
  approver: '',
  status: statusApiToView(a.status),
  content: a.content,
  timeline: [] as ApprovalTimeline[]
})

export const useApprovalStore = defineStore('approval', () => {
  const approvals = ref<Approval[]>([])
  const loading = ref(false)
  const total = ref(0)

  const pendingCount = computed(() => approvals.value.filter((a) => a.status === 'pending').length)
  const processingCount = computed(() => approvals.value.filter((a) => a.status === 'processing').length)
  const approvedCount = computed(() => approvals.value.filter((a) => a.status === 'approved').length)
  const rejectedCount = computed(() => approvals.value.filter((a) => a.status === 'rejected').length)

  const setApprovals = (data: Approval[]) => {
    approvals.value = data
  }

  /** 从后端拉取审批列表 */
  const fetchApprovals = async (params?: ApprovalQueryParams) => {
    loading.value = true
    try {
      const { data } = await getApprovalList(params)
      approvals.value = data.list.map(formatApiToView)
      total.value = data.total
    } catch {
      // 接口异常时保留现有列表
    } finally {
      loading.value = false
    }
  }

  const getApprovalById = (id: number | string): Approval | undefined => {
    return approvals.value.find((a) => String(a.id) === String(id))
  }

  const pushTimeline = (item: Approval, actor: string, action: string) => {
    item.timeline.push({
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      actor,
      action
    })
  }

  const approveItem = async (id: number | string) => {
    const item = getApprovalById(id)
    if (!item) return
    try {
      const { data } = await approveApproval(String(id))
      Object.assign(item, formatApiToView(data))
      pushTimeline(item, '管理员', '审批通过')
    } catch {
      item.status = 'approved'
      pushTimeline(item, '管理员', '审批通过')
    }
  }

  const rejectItem = async (id: number | string) => {
    const item = getApprovalById(id)
    if (!item) return
    try {
      const { data } = await rejectApproval(String(id))
      Object.assign(item, formatApiToView(data))
      pushTimeline(item, '管理员', '驳回申请')
    } catch {
      item.status = 'rejected'
      pushTimeline(item, '管理员', '驳回申请')
    }
  }

  const deleteItem = async (id: number | string) => {
    try {
      await deleteApproval(String(id))
    } catch {
      // 演示模式忽略
    }
    approvals.value = approvals.value.filter((a) => String(a.id) !== String(id))
  }

  /** 管理端新建审批（走后端 createApproval 接口）*/
  const createItem = async (payload: { title: string; type: ApprovalType; content: string; amount?: number | null }) => {
    try {
      const body: CreateApprovalPayload = {
        title: payload.title,
        type: typeViewToApi(payload.type),
        content: payload.content || '（无内容）',
        urgency: 'medium'
      }
      if (payload.amount != null) body.amount = Number(payload.amount)
      const { data } = await apiCreateApproval(body)
      approvals.value.unshift(formatApiToView(data))
      total.value += 1
    } catch {
      // 演示模式回退：本地占位
      approvals.value.unshift({
        id: `local-${Date.now()}`,
        title: payload.title,
        applicant: '当前用户',
        type: payload.type,
        amount: payload.amount ?? null,
        submitTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        approver: '待指定',
        status: 'pending',
        content: payload.content,
        timeline: [{ time: new Date().toLocaleString('zh-CN', { hour12: false }), actor: '当前用户', action: '提交申请' }]
      })
      total.value += 1
    }
  }

  return {
    approvals,
    loading,
    total,
    pendingCount,
    processingCount,
    approvedCount,
    rejectedCount,
    setApprovals,
    fetchApprovals,
    getApprovalById,
    approveItem,
    rejectItem,
    deleteItem,
    createItem
  }
})
