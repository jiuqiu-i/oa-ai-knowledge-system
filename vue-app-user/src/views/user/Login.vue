<template>
  <div class="login-page">
    <!-- Left brand -->
    <section class="brand-side">
      <div class="brand-bg">
        <div class="blob blob-1" />
        <div class="blob blob-2" />
      </div>
      <div class="brand-content">
        <router-link to="/" class="brand">
          <span class="brand-icon"><Layers :size="20" /></span>
          <span>Oak OA</span>
        </router-link>
        <h1 class="oak-h1 mb-4">欢迎回来</h1>
        <p class="oak-body-large mb-10">登录 Oak OA，体验 AI 助手与企业知识库驱动的现代办公方式。</p>
        <ul class="feature-list">
          <li v-for="feat in features" :key="feat" class="feature-item">
            <span class="check-icon"><Check :size="16" /></span>
            <span class="oak-body">{{ feat }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Right form -->
    <section class="form-side">
      <div class="form-wrapper">
        <div class="mobile-brand">
          <router-link to="/" class="brand">
            <span class="brand-icon"><Layers :size="20" /></span>
            <span>Oak OA</span>
          </router-link>
        </div>

        <n-card class="login-card" :bordered="true">
          <div class="mb-6">
            <h2 class="oak-h2 mb-1">登录账户</h2>
            <p class="oak-body">输入邮箱和密码，继续使用系统。</p>
          </div>

          <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
            <n-form-item label="邮箱" path="email">
              <n-input v-model:value="form.email" placeholder="name@company.com">
                <template #prefix><Mail :size="16" /></template>
              </n-input>
            </n-form-item>
            <n-form-item label="密码" path="password">
              <n-input v-model:value="form.password" type="password" placeholder="输入登录密码" show-password-on="click">
                <template #prefix><Lock :size="16" /></template>
              </n-input>
            </n-form-item>
            <div class="form-options">
              <n-checkbox v-model:checked="remember">记住我</n-checkbox>
              <n-button text type="primary">忘记密码？</n-button>
            </div>
            <n-button type="primary" block size="large" @click="handleLogin">登录</n-button>
          </n-form>

          <div class="divider">
            <div class="line" />
            <span class="oak-caption">或</span>
            <div class="line" />
          </div>

          <n-grid cols="2" :x-gap="12">
            <n-grid-item>
              <n-button block>
                <template #icon><Building2 :size="16" /></template>
                企业微信
              </n-button>
            </n-grid-item>
            <n-grid-item>
              <n-button block>
                <template #icon><Smartphone :size="16" /></template>
                手机号
              </n-button>
            </n-grid-item>
          </n-grid>
        </n-card>

        <p class="oak-body mt-6 text-center">
          还没有账户？
          <n-button text type="primary">联系管理员开通</n-button>
        </p>

        <div class="mobile-back">
          <n-button text @click="goHome">
            <template #icon><ArrowLeft :size="16" /></template>
            返回首页
          </n-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules, FormItemRule, FormValidationError } from 'naive-ui'
import {
  NCard, NForm, NFormItem, NInput, NButton, NCheckbox,
  NGrid, NGridItem
} from 'naive-ui'
import {
  Layers, Check, Mail, Lock, Building2, Smartphone, ArrowLeft
} from 'lucide-vue-next'
import { useUserStore } from '@/stores'

interface LoginForm {
  email: string
  password: string
}

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref<FormInst | null>(null)
const form = ref<LoginForm>({ email: '', password: '' })
const remember = ref(false)
const rules: FormRules = {
  email: { required: true, message: '请输入邮箱或工号', trigger: 'blur' } as FormItemRule,
  password: { required: true, message: '请输入密码', trigger: 'blur' } as FormItemRule
}

const features = [
  '统一待办审批与流程追踪',
  'AI 智能问答与知识库检索',
  '多端数据实时同步与权限管理'
]

const goHome = () => router.push('/')

const handleLogin = () => {
  formRef.value?.validate(async (errors?: FormValidationError[]) => {
    if (errors) return
    const ok = await userStore.login({ email: form.value.email, password: form.value.password })
    if (ok) {
      message.success('登录成功')
      router.push('/home')
    } else {
      message.error('登录失败，请检查邮箱或密码')
    }
  })
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}
@media (min-width: 1024px) {
  .login-page { flex-direction: row; }
}
.brand-side {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background: var(--oak-surface-2);
  overflow: hidden;
}
.brand-bg {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  pointer-events: none;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  background: var(--oak-primary);
}
.blob-1 {
  width: 320px;
  height: 320px;
  left: -80px;
  top: -80px;
  opacity: 0.2;
}
.blob-2 {
  width: 380px;
  height: 380px;
  right: 40px;
  bottom: 40px;
  opacity: 0.1;
}
.brand-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--oak-ink);
  margin-bottom: 40px;
}
.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--oak-primary);
  color: var(--oak-primary-foreground);
}
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.check-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(229, 138, 46, 0.1);
  color: var(--oak-primary);
  flex-shrink: 0;
}
.form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--oak-background);
}
.form-wrapper {
  width: 100%;
  max-width: 420px;
}
.mobile-brand {
  margin-bottom: 32px;
}
@media (min-width: 1024px) {
  .mobile-brand { display: none; }
}
.login-card {
  border: 1px solid var(--oak-line);
  border-radius: 12px;
  box-shadow: var(--oak-shadow-2);
}
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
}
.line {
  flex: 1;
  height: 1px;
  background: var(--oak-line);
}
.text-center {
  text-align: center;
}
.mobile-back {
  margin-top: 32px;
  text-align: center;
}
@media (min-width: 1024px) {
  .mobile-back { display: none; }
}
.mb-1 { margin-bottom: 4px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-10 { margin-bottom: 40px; }
.mt-6 { margin-top: 24px; }
</style>
