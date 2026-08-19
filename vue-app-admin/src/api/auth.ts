import request from './request'
import type { ApiResponse, LoginCredentials, User } from '@/types'

export function login(credentials: LoginCredentials) {
  return request.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials)
}

export function getCurrentUser() {
  return request.get<ApiResponse<User>>('/auth/me')
}

export function logout() {
  return request.post<ApiResponse<null>>('/auth/logout')
}
