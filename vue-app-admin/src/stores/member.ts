import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, UserPayload } from '@/types'
import { createUser, updateUser, deleteUser, disableUser } from '@/api/user'

export const useMemberStore = defineStore('member', () => {
  const members = ref<User[]>([])
  const loading = ref(false)

  const setMembers = (data: User[]) => {
    members.value = data
  }

  const createMember = async (payload: UserPayload) => {
    try {
      await createUser(payload)
    } catch {
      // fallback for demo mode
    }
    members.value.unshift({
      id: Date.now(),
      joinedAt: new Date().toISOString().slice(0, 10),
      ...payload
    })
  }

  const updateMember = async (id: number, payload: UserPayload) => {
    try {
      await updateUser(id, payload)
    } catch {
      // fallback for demo mode
    }
    const index = members.value.findIndex(m => m.id === id)
    if (index !== -1) {
      members.value[index] = { ...members.value[index], ...payload }
    }
  }

  const deleteMember = async (id: number) => {
    try {
      await deleteUser(id)
    } catch {
      // fallback for demo mode
    }
    members.value = members.value.filter(m => m.id !== id)
  }

  const disableMember = async (id: number) => {
    const index = members.value.findIndex(m => m.id === id)
    if (index === -1) return
    try {
      await disableUser(id)
    } catch {
      // fallback for demo mode
    }
    members.value[index].status = 'inactive'
  }

  return {
    members,
    loading,
    setMembers,
    createMember,
    updateMember,
    deleteMember,
    disableMember
  }
})
