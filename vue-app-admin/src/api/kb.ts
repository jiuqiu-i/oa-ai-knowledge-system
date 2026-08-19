import request from './request'
import type { ApiResponse, KbDoc, KbDocPayload, KbCategory, PaginatedData } from '@/types'

export function getKbCategories() {
  return request.get<ApiResponse<KbCategory[]>>('/kb/categories')
}

export function getKbDocuments(params?: { page?: number; pageSize?: number; keyword?: string; category?: string }) {
  return request.get<ApiResponse<PaginatedData<KbDoc>>>('/kb/documents', { params })
}

export function getKbDocumentDetail(id: number) {
  return request.get<ApiResponse<KbDoc>>(`/kb/documents/${id}`)
}

export function createKbDocument(data: KbDocPayload) {
  return request.post<ApiResponse<KbDoc>>('/kb/documents', data)
}

export function updateKbDocument(id: number, data: KbDocPayload) {
  return request.put<ApiResponse<KbDoc>>(`/kb/documents/${id}`, data)
}

export function deleteKbDocument(id: number) {
  return request.delete<ApiResponse<null>>(`/kb/documents/${id}`)
}
