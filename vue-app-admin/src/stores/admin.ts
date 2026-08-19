import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BreadcrumbRoute } from './types'

export const useAdminStore = defineStore('admin', () => {
  const currentUser = ref({
    name: '管理员',
    avatar: '管',
    role: 'admin'
  })

  const unreadNotifications = ref(3)

  const pageTitle = ref('管理概览')

  const setPageTitle = (title: string) => {
    pageTitle.value = title
  }

  const menuCollapsed = ref(false)

  const toggleMenu = () => {
    menuCollapsed.value = !menuCollapsed.value
  }

  const breadcrumbs = computed<BreadcrumbRoute[]>(() => {
    return [{ label: '首页', path: '/' }, { label: pageTitle.value }]
  })

  return {
    currentUser,
    unreadNotifications,
    pageTitle,
    menuCollapsed,
    setPageTitle,
    toggleMenu,
    breadcrumbs
  }
})
