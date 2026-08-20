import request from './request'
import type {
  ApiUser,
  ApiUserStatus,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  PaginatedData
} from '@/types'

/**
 * 用户管理接口对接
 * 后端 Controller 路径为 /users，主键为 UUID 字符串
 */

/** 用户列表（分页，支持 keyword/dept/status 筛选）*/
export function getUserList(params?: UserQueryParams) {
  return request.get<PaginatedData<ApiUser>>('/users', { params })
}

/** 部门列表（后端返回 string[]）*/
export function getDepartments() {
  return request.get<string[]>('/users/departments')
}

/** 用户详情 */
export function getUserDetail(id: string) {
  return request.get<ApiUser>(`/users/${id}`)
}

/** 创建用户（仅管理员）*/
export function createUser(data: CreateUserPayload) {
  return request.post<ApiUser>('/users', data)
}

/** 更新用户（PATCH，仅管理员）*/
export function updateUser(id: string, data: UpdateUserPayload) {
  return request.patch<ApiUser>(`/users/${id}`, data)
}

/** 删除用户（仅管理员）*/
export function deleteUser(id: string) {
  return request.delete<{ id: string }>(`/users/${id}`)
}

/**
 * 启用/禁用用户
 * 后端为 PATCH /users/:id/status，body: { status }
 */
export function updateUserStatus(id: string, status: ApiUserStatus) {
  return request.patch<ApiUser>(`/users/${id}/status`, { status })
}

/** 禁用用户（updateUserStatus 的便捷封装）*/
export function disableUser(id: string) {
  return updateUserStatus(id, 'disabled')
}

/** 启用用户 */
export function enableUser(id: string) {
  return updateUserStatus(id, 'active')
}
