import request from './request'
import type {
  ApiHotDoc,
  ApiKbDoc,
  CreateKbPayload,
  KbQueryParams,
  PaginatedData
} from '@/types'

/**
 * 知识库接口对接
 * 后端 Controller 路径为 /knowledge-base，主键为 UUID 字符串
 */

/** 分类列表（后端返回 string[]）*/
export function getKbCategories() {
  return request.get<string[]>('/knowledge-base/categories')
}

/** 热门文档 */
export function getHotDocs() {
  return request.get<ApiHotDoc[]>('/knowledge-base/hot')
}

/** 文档列表 / 搜索（后端分页返回 { list, total, page, pageSize }）*/
export function getKbDocuments(params?: KbQueryParams) {
  return request.get<PaginatedData<ApiKbDoc>>('/knowledge-base', { params })
}

/** 文档详情（同时自增浏览量）*/
export function getKbDocumentDetail(id: string) {
  return request.get<ApiKbDoc>(`/knowledge-base/${id}`)
}

/** 创建文档（authorId 由后端从当前登录用户注入）*/
export function createKbDocument(data: CreateKbPayload) {
  return request.post<ApiKbDoc>('/knowledge-base', data)
}

/** 更新文档（PATCH）*/
export function updateKbDocument(id: string, data: Partial<CreateKbPayload>) {
  return request.patch<ApiKbDoc>(`/knowledge-base/${id}`, data)
}

/** 删除文档 */
export function deleteKbDocument(id: string) {
  return request.delete<{ id: string }>(`/knowledge-base/${id}`)
}
