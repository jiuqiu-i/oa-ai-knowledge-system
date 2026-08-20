<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules, FormItemRule, FormValidationError } from 'naive-ui'
import { NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { ShieldCheck, Mail, Lock } from 'lucide-vue-next'
import { useUserStore } from '@/stores'

interface LoginForm {
  email: string
  password: string
}

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const form = ref<LoginForm>({ email: '', password: '' })

const rules: FormRules = {
  email: { required: true, message: '请输入邮箱', trigger: 'blur' } as FormItemRule,
  password: { required: true, message: '请输入密码', trigger: 'blur' } as FormItemRule
}

const handleLogin = () => {
  formRef.value?.validate(async (errors?: FormValidationError[]) => {
    if (errors) return
    loading.value = true
    const ok = await userStore.login({ email: form.value.email, password: form.value.password })
    loading.value = false
    if (ok) {
      message.success('登录成功')
      const redirect = (router.currentRoute.value.query.redirect as string) || '/admin/dashboard'
      router.push(redirect)
    } else {
      message.error('登录失败，请检查邮箱或密码')
    }
  })
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
    </div>

    <div class="login-card-wrapper">
      <div class="brand">
        <span class="brand-icon"><ShieldCheck :size="20" /></span>
        <span class="brand-text">Oak OA 管理端</span>
      </div>

      <n-card class="login-card" :bordered="false">
        <h2 class="login-title">管理员登录</h2>
        <p class="login-subtitle">输入管理员账户凭据以进入后台</p>

        <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
          <n-form-item label="邮箱" path="email">
            <n-input
              v-model:value="form.email"
              placeholder="admin@company.com"
              @keyup.enter="handleLogin"
            >
              <template #prefix><Mail :size="16" /></template>
            </n-input>
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="form.password"
              type="password"
              placeholder="输入登录密码"
              show-password-on="click"
              @keyup.enter="handleLogin"
            >
              <template #prefix><Lock :size="16" /></template>
            </n-input>
          </n-form-item>
          <n-button
            type="primary"
            block
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </n-button>
        </n-form>
      </n-card>

      <p class="login-footer">Oak OA 知识管理系统 · 管理后台</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FDFBF7;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.blob-1 {
  width: 360px;
  height: 360px;
  left: -100px;
  top: -100px;
  background: #E58A2E;
  opacity: 0.12;
}

.blob-2 {
  width: 420px;
  height: 420px;
  right: -120px;
  bottom: -120px;
  background: #2E90FA;
  opacity: 0.08;
}

.login-card-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 0 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 32px;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #E58A2E;
  color: #fff;
}

.brand-text {
  font-size: 22px;
  font-weight: 700;
  color: #2A261F;
}

.login-card {
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(42, 38, 31, 0.08);
}

.login-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: #2A261F;
}

.login-subtitle {
  margin: 0 0 24px;
  font-size: 14px;
  color: #9F968A;
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: #9F968A;
}
</style>
