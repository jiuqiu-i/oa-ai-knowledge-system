<template>
  <n-layout-footer bordered class="oak-footer">
    <div class="footer-inner">
      <div class="brand">
        <span class="brand-icon">
          <Layers :size="16" />
        </span>
        <span>Oak OA</span>
      </div>
      <p class="copyright">© 2026 Oak OA. AI 驱动的办公与知识管理。</p>
      <n-space>
        <n-button text type="primary">帮助中心</n-button>
        <n-button text type="primary">隐私政策</n-button>
      </n-space>
    </div>
  </n-layout-footer>
</template>

<script setup lang="ts">
import { NLayoutFooter, NSpace, NButton } from 'naive-ui'
import { Layers } from 'lucide-vue-next'
</script>

<style scoped>
.oak-footer {
  background: var(--oak-surface);
  padding: 40px 24px;
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
@media (min-width: 768px) {
  .footer-inner {
    flex-direction: row;
  }
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--oak-ink);
}
.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--oak-primary);
  color: var(--oak-primary-foreground);
}
.copyright {
  font-size: 13px;
  color: var(--oak-ink-3);
  margin: 0;
}
</style>
