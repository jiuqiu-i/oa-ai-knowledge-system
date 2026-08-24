import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { KbDoc, KbDocPayload, KbCategory } from '@/types'
import {
  createKbDocument,
  updateKbDocument,
  deleteKbDocument,
  getKbDocuments,
  getKbCategories
} from '@/api/kb'
import type { ApiKbDoc, KbQueryParams } from '@/types'

/**
 * 视图模型 <-> 后端实体映射
 * 视图模型 KbDoc 含 status/attachment/updatedAt；后端 ApiKbDoc 无 status/attachment，使用 createdAt/updatedAt
 */

const formatApiToView = (d: ApiKbDoc): KbDoc => ({
  id: d.id,
  title: d.title,
  category: d.category,
  author: d.author?.name || '未知',
  updatedAt: (d.updatedAt || d.createdAt || '').slice(0, 10),
  status: '已发布',
  statusType: 'success',
  content: d.content,
  attachment: d.attachment ?? null
})

export const useKbStore = defineStore('kb', () => {
  const documents = ref<KbDoc[]>([])
  const categories = ref<KbCategory[]>([])
  const loading = ref(false)
  const total = ref(0)

  const setDocuments = (data: KbDoc[]) => {
    documents.value = data
  }

  const setCategories = (data: KbCategory[]) => {
    categories.value = data
  }

  /** 从后端拉取文档列表 */
  const fetchDocuments = async (params?: KbQueryParams) => {
    loading.value = true
    try {
      const { data } = await getKbDocuments(params)
      documents.value = data.list.map(formatApiToView)
      total.value = data.total
    } catch {
      // 接口异常时保留现有列表
    } finally {
      loading.value = false
    }
  }

  /** 从后端拉取分类（string[] -> KbCategory[]）*/
  const fetchCategories = async () => {
    try {
      const { data } = await getKbCategories()
      categories.value = data.map((c) => ({ label: c, key: c }))
    } catch {
      categories.value = []
    }
  }

  const createDocument = async (payload: Omit<KbDoc, 'id' | 'updatedAt'>) => {
    try {
      const { data } = await createKbDocument({
        title: payload.title,
        category: payload.category,
        content: payload.content || '',
        attachment: payload.attachment ?? null,
      })
      documents.value.unshift(formatApiToView(data))
    } catch {
      // 演示模式回退
      documents.value.unshift({
        id: Date.now(),
        updatedAt: new Date().toISOString().slice(0, 10),
        ...payload
      })
    }
  }

  const updateDocument = async (id: number | string, payload: Partial<KbDocPayload>) => {
    try {
      const { data } = await updateKbDocument(String(id), {
        title: payload.title,
        category: payload.category,
        content: payload.content,
        attachment: payload.attachment,
      })
      const updated = formatApiToView(data)
      const index = documents.value.findIndex((d) => String(d.id) === String(id))
      if (index !== -1) documents.value[index] = updated
    } catch {
      const index = documents.value.findIndex((d) => String(d.id) === String(id))
      if (index !== -1) {
        documents.value[index] = { ...documents.value[index], ...payload }
      }
    }
  }

  const deleteDocument = async (id: number | string) => {
    try {
      await deleteKbDocument(String(id))
    } catch {
      // 演示模式忽略
    }
    documents.value = documents.value.filter((d) => String(d.id) !== String(id))
  }

  return {
    documents,
    categories,
    loading,
    total,
    setDocuments,
    setCategories,
    fetchDocuments,
    fetchCategories,
    createDocument,
    updateDocument,
    deleteDocument
  }
})
