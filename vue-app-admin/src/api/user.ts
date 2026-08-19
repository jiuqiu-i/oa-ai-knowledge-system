import request from './request'
import type { ApiResponse, PaginatedData, User, UserPayload } from '@/types'

export function getUserList(params?: { page?: number; pageSize?: number; keyword?: string; status?: string; role?: string }) {
  return request.get<ApiResponse<PaginatedData<User>>>('/users', { params })
}

export function getUserDetail(id: number) {
  return request.get<ApiResponse<User>>(`/users/${id}`)
}

export function createUser(data: UserPayload) {
  return request.post<ApiResponse<User>>('/users', data)
}

export function updateUser(id: number, data: UserPayload) {
  return request.put<ApiResponse<User>>(`/users/${id}`, data)
}

export function deleteUser(id: number) {
  return request.delete<ApiResponse<null>>(`/users/${id}`)
}

export function disableUser(id: number) {
  return request.patch<ApiResponse<User>>(`/users/${id}/disable`)
}
