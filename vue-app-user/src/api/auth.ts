import request, { setToken, clearToken } from './request'
import type { ApiLoginResult, ApiUser, LoginPayload } from '@/types'

/** 用户登录（后端直接返回 { token, user }，无 ApiResponse 包裹）*/
export const login = (payload: LoginPayload) => {
  return request.post<ApiLoginResult>('/auth/login', payload)
}

/** 用户注册 */
export const register = (payload: LoginPayload & { name: string }) => {
  return request.post<ApiUser>('/auth/register', payload)
}

/** 获取当前用户信息 */
export const getProfile = () => {
  return request.get<ApiUser>('/auth/profile')
}

/**
 * 登出：后端未提供登出接口，仅清理本地凭证
 * （JWT 为无状态令牌，前端清除即视为登出）
 */
export const logout = () => {
  clearToken()
  return Promise.resolve()
}

export const setAuthToken = (token: string) => {
  setToken(token)
}
