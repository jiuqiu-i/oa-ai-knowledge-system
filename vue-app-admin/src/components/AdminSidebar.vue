<script setup lang="ts">
import { computed, h } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import {
  NLayoutSider,
  NMenu,
  NButton
} from 'naive-ui'
import {
  LayoutDashboard,
  BookOpen,
  Cpu,
  Users,
  ClipboardCheck,
  Layers,
  ArrowLeft
} from 'lucide-vue-next'

interface SidebarMenuOption {
  label: string
  key: string
  path: string
  icon: Component
}

const route = useRoute()
const router = useRouter()

const menuOptions: SidebarMenuOption[] = [
  {
    label: '管理概览',
    key: 'admin-dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard'
  },
  {
    label: '知识库管理',
    key: 'admin-kb',
    icon: BookOpen,
    path: '/admin/kb'
  },
  {
    label: 'AI 接入配置',
    key: 'admin-ai-config',
    icon: Cpu,
    path: '/admin/ai-config'
  },
  {
    label: '成员管理',
    key: 'admin-members',
    icon: Users,
    path: '/admin/members'
  },
  {
    label: '审批管理',
    key: 'admin-approvals',
    icon: ClipboardCheck,
    path: '/admin/approvals'
  }
]

const activeKey = computed(() => {
  return (route.meta?.menuKey as string | undefined) || route.path
})

function handleMenuUpdate(key: string) {
  const item = menuOptions.find((i) => i.key === key)
  if (item?.path) {
    router.push(item.path)
  }
}

function goHome() {
  router.push('/')
}

function renderMenuIcon(option: MenuOption) {
  return h((option as unknown as SidebarMenuOption).icon, { size: 18 })
}
</script>

<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    show-trigger
    class="admin-sidebar"
  >
    <div class="sidebar-header">
      <span class="brand-icon">
        <Layers :size="20" />
      </span>
      <span class="brand-title">Oak OA 管理</span>
    </div>

    <n-menu
      :value="activeKey"
      :options="menuOptions as unknown as MenuOption[]"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :render-icon="renderMenuIcon"
      @update:value="handleMenuUpdate"
    />

    <div class="sidebar-footer">
      <n-button quaternary class="back-btn" @click="goHome">
        <template #icon>
          <ArrowLeft :size="18" />
        </template>
        <span class="back-text">返回用户端</span>
      </n-button>
    </div>
  </n-layout-sider>
</template>

<style scoped>
.admin-sidebar {
  background: #2A261F;
  min-height: 100vh;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #E58A2E;
  color: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-title {
  font-size: 16px;
  font-weight: 600;
  color: #F5F1EA;
  white-space: nowrap;
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.back-btn {
  color: #9F968A;
  width: 100%;
  justify-content: flex-start;
}

.back-btn:hover {
  color: #F5F1EA;
}

.back-text {
  white-space: nowrap;
}
</style>
