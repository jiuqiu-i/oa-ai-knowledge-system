import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Approval, ApprovalStatus, ApprovalType } from '@/types'
import { approveApproval, rejectApproval, deleteApproval } from '@/api/approval'

export const useApprovalStore = defineStore('approval', () => {
  const approvals = ref<Approval[]>([])
  const loading = ref(false)

  const pendingCount = computed(() => approvals.value.filter(a => a.status === 'pending').length)
  const processingCount = computed(() => approvals.value.filter(a => a.status === 'processing').length)
  const approvedCount = computed(() => approvals.value.filter(a => a.status === 'approved').length)
  const rejectedCount = computed(() => approvals.value.filter(a => a.status === 'rejected').length)

  const setApprovals = (data: Approval[]) => {
    approvals.value = data
  }

  const fetchApprovals = async (params?: { status?: ApprovalStatus; type?: ApprovalType; keyword?: string }) => {
    loading.value = true
    try {
      // TODO: replace with API call when backend is ready
      console.log('fetch approvals with params', params)
    } finally {
      loading.value = false
    }
  }

  const getApprovalById = (id: number): Approval | undefined => {
    return approvals.value.find(a => a.id === id)
  }

  const approveItem = async (id: number) => {
    const item = approvals.value.find(a => a.id === id)
    if (!item) return
    try {
      await approveApproval(id)
      item.status = 'approved'
      item.timeline.push({
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        actor: '管理员',
        action: '审批通过'
      })
    } catch {
      // fallback for demo mode
      item.status = 'approved'
      item.timeline.push({
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        actor: '管理员',
        action: '审批通过'
      })
    }
  }

  const rejectItem = async (id: number) => {
    const item = approvals.value.find(a => a.id === id)
    if (!item) return
    try {
      await rejectApproval(id)
      item.status = 'rejected'
      item.timeline.push({
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        actor: '管理员',
        action: '驳回申请'
      })
    } catch {
      item.status = 'rejected'
      item.timeline.push({
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        actor: '管理员',
        action: '驳回申请'
      })
    }
  }

  const deleteItem = async (id: number) => {
    try {
      await deleteApproval(id)
      approvals.value = approvals.value.filter(a => a.id !== id)
    } catch {
      approvals.value = approvals.value.filter(a => a.id !== id)
    }
  }

  return {
    approvals,
    loading,
    pendingCount,
    processingCount,
    approvedCount,
    rejectedCount,
    setApprovals,
    fetchApprovals,
    getApprovalById,
    approveItem,
    rejectItem,
    deleteItem
  }
})
