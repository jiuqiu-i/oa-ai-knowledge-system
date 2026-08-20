import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiUser, LoginCredentials } from '@/types'
import { login as apiLogin, getCurrentUser, logout as apiLogout } from '@/api/auth'

/**
 * 用户 store：对接 /auth/admin-login、/auth/profile
 * - login：调用后端管理员登录，写入 token + 用户信息
 * - fetchProfile：刷新页面后凭 token 恢复登录态
 * - logout：清理本地凭证（JWT 无状态，无需调用登出接口）
 */
export const useUserStore = defineStore('user', () => {
  const TOKEN_KEY = 'oa_admin_token'

  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  // 后端返回的原始用户实体；未登录时为 null
  const user = ref<ApiUser | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const setToken = (value: string) => {
    token.value = value
    localStorage.setItem(TOKEN_KEY, value)
  }

  const clearToken = () => {
    token.value = ''
    localStorage.removeItem(TOKEN_KEY)
  }

  const setUser = (u: ApiUser) => {
    user.value = u
  }

  /** 登录：调用后端 /auth/admin-login，成功后写入 token + 用户 */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const { data } = await apiLogin(credentials)
      setToken(data.token)
      setUser(data.user)
      return true
    } catch {
      return false
    }
  }

  /** 凭现有 token 拉取当前用户信息（用于刷新页面恢复登录态）*/
  const fetchProfile = async (): Promise<void> => {
    if (!token.value) return
    try {
      const { data } = await getCurrentUser()
      // 安全保护：若拉取后发现当前用户不是管理员，立即踢回登录页
      if (data.role !== 'admin') {
        clearToken()
        user.value = null
        return
      }
      setUser(data)
    } catch {
      // token 无效或过期，清理本地态
      clearToken()
      user.value = null
    }
  }

  const logout = () => {
    apiLogout()
    clearToken()
    user.value = null
  }

  // 兼容旧代码读取 currentUser / avatar 的便捷字段
  const currentUser = computed(() => user.value)

  return {
    token,
    user,
    currentUser,
    isLoggedIn,
    isAdmin,
    setToken,
    clearToken,
    setUser,
    login,
    fetchProfile,
    logout
  }
})
