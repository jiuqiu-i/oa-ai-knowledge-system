<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NGlobalStyle
} from 'naive-ui'

import { themeOverrides } from './styles/naive-theme'
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <router-view />
          <n-global-style />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
#app {
  min-height: 100vh;
  font-family: var(--oak-font-sans);
  background-color: var(--oak-background);
  color: var(--oak-foreground);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--oak-background);
  color: var(--oak-foreground);
}
</style>
