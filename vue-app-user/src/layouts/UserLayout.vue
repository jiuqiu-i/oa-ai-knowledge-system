<template>
  <n-layout class="user-layout">
    <UserNav />
    <n-layout-content class="user-content">
      <RouterView />
    </n-layout-content>
    <AppFooter />
  </n-layout>
</template>

<script setup lang="ts">
import { NLayout, NLayoutContent } from 'naive-ui'
import UserNav from '@/components/UserNav.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background: var(--oak-background);
}
.user-content {
  background: var(--oak-background);
}
</style>
