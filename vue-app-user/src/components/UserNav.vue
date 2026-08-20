<template>
  <n-layout-header bordered class="oak-nav">
    <div class="nav-inner">
      <router-link to="/" class="brand">
        <span class="brand-icon">
          <Layers :size="20" />
        </span>
        <span>Oak OA</span>
      </router-link>

      <n-menu
        mode="horizontal"
        :value="activeKey"
        :options="menuOptions"
        class="nav-menu"
        @update:value="onMenuSelect"
      />

      <n-space align="center" :wrap="false">
        <n-button v-if="!userStore.isLoggedIn" ghost type="primary" @click="goLogin">
          登录
        </n-button>
        <n-button type="primary" @click="goHome">
          开始使用
        </n-button>
      </n-space>
    </div>
  </n-layout-header>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayoutHeader, NMenu, NSpace, NButton } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { Layers, Home, BookOpen, Bot, LayoutDashboard } from 'lucide-vue-next'
import { useUserStore } from '@/stores'
import type { Component } from 'vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

interface MenuItem {
  key: string
  label: string
  icon: Component
  path: string
  newWindow?: boolean
}

const activeKey = computed(() => {
  const map: Record<string, string> = {
    Index: 'index',
    Home: 'home',
    KbExplore: 'kb',
    AiAssistant: 'ai'
  }
  return map[route.name as string] || 'index'
})

const rawMenu: MenuItem[] = [
  { key: 'index', label: '首页', icon: Home, path: '/' },
  { key: 'home', label: '工作台', icon: LayoutDashboard, path: '/home' },
  { key: 'kb', label: '知识库', icon: BookOpen, path: '/kb' },
  { key: 'ai', label: 'AI 助手', icon: Bot, path: '/ai', newWindow: true }
]

const menuOptions = computed<MenuOption[]>(() =>
  rawMenu.map((item) => ({
    key: item.key,
    label: item.label,
    icon: () => h(item.icon, { size: 16 })
  }))
)

const onMenuSelect = (key: string) => {
  const item = rawMenu.find((i) => i.key === key)
  if(item?.newWindow) {
    window.open(item.path, '_blank')
  } else if (item) router.push(item.path)
}

const goLogin = () => router.push('/login')
const goHome = () => router.push('/home')
</script>

<style scoped>
.oak-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}
.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--oak-ink);
}
.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--oak-primary);
  color: var(--oak-primary-foreground);
}
.nav-menu {
  flex: 1;
  max-width: 480px;
  justify-content: center;
}
:deep(.n-menu.n-menu--horizontal) {
  background: transparent;
}
:deep(.n-menu-item-content) {
  padding: 8px 16px !important;
  border-radius: 6px;
}
:deep(.n-menu-item-content--selected) {
  background: var(--oak-muted) !important;
}
</style>
