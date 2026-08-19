<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NInput,
  NButton,
  NBadge,
  NAvatar,
  NSpace
} from 'naive-ui'
import { Search, Bell } from 'lucide-vue-next'
import AdminSidebar from '@/components/AdminSidebar.vue'
import { useAdminStore, useUserStore } from '@/stores'

const route = useRoute()
const adminStore = useAdminStore()
const userStore = useUserStore()

const pageTitle = computed(() => (route.meta?.title as string | undefined) || '管理后台')

watch(
  () => route.meta?.title as string | undefined,
  (title) => {
    if (title) {
      adminStore.setPageTitle(title)
    }
  },
  { immediate: true }
)
</script>

<template>
  <n-layout has-sider class="admin-layout">
    <AdminSidebar />

    <n-layout>
      <n-layout-header bordered class="admin-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <n-input
            placeholder="搜索"
            class="header-search"
            size="small"
          >
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>
          <n-badge :value="adminStore.unreadNotifications" :max="99">
            <n-button quaternary circle>
              <template #icon>
                <Bell :size="18" />
              </template>
            </n-button>
          </n-badge>
          <n-space align="center" :size="8">
            <n-avatar
              round
              :size="32"
              :style="{
                background: '#E58A2E',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600
              }"
            >
              {{ userStore.currentUser.avatar }}
            </n-avatar>
            <span class="user-name">{{ userStore.currentUser.name }}</span>
          </n-space>
        </div>
      </n-layout-header>

      <n-layout-content class="admin-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2A261F;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-search {
  width: 240px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #2A261F;
}

.admin-content {
  background: #FDFBF7;
  padding: 24px;
  min-height: calc(100vh - 64px);
}

@media (max-width: 768px) {
  .header-search {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
