import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { KbDoc, KbDocPayload, KbCategory } from '@/types'
import { createKbDocument, updateKbDocument, deleteKbDocument } from '@/api/kb'

export const useKbStore = defineStore('kb', () => {
  const documents = ref<KbDoc[]>([])
  const categories = ref<KbCategory[]>([])
  const loading = ref(false)

  const setDocuments = (data: KbDoc[]) => {
    documents.value = data
  }

  const setCategories = (data: KbCategory[]) => {
    categories.value = data
  }

  const createDocument = async (payload: Omit<KbDoc, 'id' | 'updatedAt'>) => {
    try {
      await createKbDocument(payload)
    } catch {
      // fallback for demo mode
    }
    documents.value.unshift({
      id: Date.now(),
      updatedAt: new Date().toISOString().slice(0, 10),
      ...payload
    })
  }

  const updateDocument = async (id: number, payload: Partial<KbDocPayload>) => {
    try {
      await updateKbDocument(id, payload as KbDocPayload)
    } catch {
      // fallback for demo mode
    }
    const index = documents.value.findIndex(d => d.id === id)
    if (index !== -1) {
      documents.value[index] = { ...documents.value[index], ...payload }
    }
  }

  const deleteDocument = async (id: number) => {
    try {
      await deleteKbDocument(id)
    } catch {
      // fallback for demo mode
    }
    documents.value = documents.value.filter(d => d.id !== id)
  }

  return {
    documents,
    categories,
    loading,
    setDocuments,
    setCategories,
    createDocument,
    updateDocument,
    deleteDocument
  }
})
