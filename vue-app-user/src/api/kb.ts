import request from './request'
import type { ApiResponse, KbCategory, KbDoc } from '@/types'

export interface KbSearchParams {
  keyword?: string
  category?: string
  tag?: string
  sort?: 'relevance' | 'latest' | 'hottest'
  page?: number
  size?: number
}

export const getCategories = () => {
  return request.get<ApiResponse<KbCategory[]>>('/kb/categories')
}

export const getDocList = (params?: KbSearchParams) => {
  return request.get<ApiResponse<KbDoc[]>>('/kb/docs', { params })
}

export const searchDocs = (params: KbSearchParams) => {
  return request.get<ApiResponse<KbDoc[]>>('/kb/docs/search', { params })
}

export const getDocDetail = (id: number) => {
  return request.get<ApiResponse<KbDoc>>(`/kb/docs/${id}`)
}

export const createDoc = (payload: Partial<KbDoc>) => {
  return request.post<ApiResponse<KbDoc>>('/kb/docs', payload)
}
