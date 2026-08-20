import request from './request'
import type { ApiLoginResult, ApiUser, LoginCredentials } from '@/types'

const TOKEN_KEY = 'oa_admin_token'

/** 管理员登录（后端 /auth/admin-login，管理端专用，校验 ADMIN 角色）*/
export function login(credentials: LoginCredentials) {
  return request.post<ApiLoginResult>('/auth/admin-login', credentials)
}

/** 获取当前用户信息（后端 /auth/profile）*/
export function getCurrentUser() {
  return request.get<ApiUser>('/auth/profile')
}

/**
 * 登出：清理本地凭证（JWT 为无状态令牌，前端清除即视为登出）
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  return Promise.resolve()
}
