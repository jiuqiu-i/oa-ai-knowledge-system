import request, { setToken, clearToken } from './request'
import type { ApiResponse, LoginPayload, LoginResult, User } from '@/types'

export const login = (payload: LoginPayload) => {
  return request.post<ApiResponse<LoginResult>>('/auth/login', payload)
}

export const logout = () => {
  clearToken()
  return request.post<ApiResponse<null>>('/auth/logout')
}

export const getProfile = () => {
  return request.get<ApiResponse<User>>('/auth/profile')
}

export const setAuthToken = (token: string) => {
  setToken(token)
}
