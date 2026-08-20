import request from './request'
import type { ApiKbDoc, ApiHotDoc, PaginatedData } from '@/types'

/**
 * 知识库接口对接
 * 后端 Controller 路径为 /knowledge-base，主键为 UUID 字符串
 */

export interface KbQueryParams {
  keyword?: string
  category?: string
  tag?: string
  page?: number
  pageSize?: number
}

export interface CreateKbPayload {
  title: string
  category: string
  tags?: string[]
  summary?: string
  content: string
}

export interface UpdateKbPayload extends Partial<CreateKbPayload> {}

/** 分类列表（后端返回 string[]）*/
export const getCategories = () => {
  return request.get<string[]>('/knowledge-base/categories')
}

/** 热门文档 */
export const getHotDocs = () => {
  return request.get<ApiHotDoc[]>('/knowledge-base/hot')
}

/** 文档列表 / 搜索（后端分页返回 { list, total, page, pageSize }）*/
export const getDocList = (params?: KbQueryParams) => {
  return request.get<PaginatedData<ApiKbDoc>>('/knowledge-base', { params })
}

/** 文档详情（同时自增浏览量）*/
export const getDocDetail = (id: string) => {
  return request.get<ApiKbDoc>(`/knowledge-base/${id}`)
}

/** 创建文档（authorId 由后端从当前登录用户注入）*/
export const createDoc = (payload: CreateKbPayload) => {
  return request.post<ApiKbDoc>('/knowledge-base', payload)
}

/** 更新文档 */
export const updateDoc = (id: string, payload: UpdateKbPayload) => {
  return request.patch<ApiKbDoc>(`/knowledge-base/${id}`, payload)
}

/** 删除文档 */
export const deleteDoc = (id: string) => {
  return request.delete<{ id: string }>(`/knowledge-base/${id}`)
}
