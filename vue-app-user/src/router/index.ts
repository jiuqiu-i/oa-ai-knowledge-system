import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import Index from '@/views/user/Index.vue'
import Home from '@/views/user/Home.vue'
import KbExplore from '@/views/user/KbExplore.vue'
import AiAssistant from '@/views/user/AiAssistant.vue'
import Login from '@/views/user/Login.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: UserLayout,
    children: [
      { path: '', name: 'Index', component: Index },
      { path: 'home', name: 'Home', component: Home },
      { path: 'kb', name: 'KbExplore', component: KbExplore },
      { path: 'ai', name: 'AiAssistant', component: AiAssistant }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
