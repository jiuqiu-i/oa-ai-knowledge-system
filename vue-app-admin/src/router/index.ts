import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '管理概览', menuKey: 'admin-dashboard' }
      },
      {
        path: 'kb',
        name: 'AdminKb',
        component: () => import('@/views/admin/Kb.vue'),
        meta: { title: '知识库管理', menuKey: 'admin-kb' }
      },
      {
        path: 'ai-config',
        name: 'AdminAiConfig',
        component: () => import('@/views/admin/AiConfig.vue'),
        meta: { title: 'AI 接入配置', menuKey: 'admin-ai-config' }
      },
      {
        path: 'members',
        name: 'AdminMembers',
        component: () => import('@/views/admin/Members.vue'),
        meta: { title: '成员管理', menuKey: 'admin-members' }
      },
      {
        path: 'approvals',
        name: 'AdminApprovals',
        component: () => import('@/views/admin/Approvals.vue'),
        meta: { title: '审批管理', menuKey: 'admin-approvals' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title ? `${title} - Oak OA 管理端` : 'Oak OA 管理端'
})

export default router
