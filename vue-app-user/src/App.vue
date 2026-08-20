<template>
  <n-config-provider :theme-overrides="oakThemeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <RouterView />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { zhCN, dateZhCN } from 'naive-ui'
import { oakThemeOverrides } from '@/styles/naive-theme'
import { useUserStore } from '@/stores'

// 应用启动时若本地存在 token，则恢复登录态，避免刷新后 isLoggedIn 重置导致登录按钮复现
const userStore = useUserStore()
onMounted(() => {
  if (localStorage.getItem('oa_user_token')) {
    userStore.fetchProfile()
  }
})
</script>
