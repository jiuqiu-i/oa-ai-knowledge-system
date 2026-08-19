import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('oa_token') || '')
  const currentUser = ref<User>({
    id: 0,
    name: '管理员',
    email: 'admin@oakoa.com',
    department: '管理部',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-01',
    avatar: '管'
  })

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (value: string) => {
    token.value = value
    localStorage.setItem('oa_token', value)
  }

  const clearToken = () => {
    token.value = ''
    localStorage.removeItem('oa_token')
  }

  const setUser = (user: User) => {
    currentUser.value = user
  }

  const logout = () => {
    clearToken()
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    setToken,
    clearToken,
    setUser,
    logout
  }
})
