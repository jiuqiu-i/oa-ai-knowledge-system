<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SelectOption } from 'naive-ui'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NSwitch,
  NIcon,
  NSpin,
  useMessage
} from 'naive-ui'
import { Save, Cpu } from 'lucide-vue-next'
import { getAiConfig, saveAiConfig } from '@/api/aiConfig'

const message = useMessage()
const loading = ref(false)
const saving = ref(false)

interface AiConfigForm {
  provider: string
  apiKey: string
  model: string
  temperature: string
  maxTokens: string
  enabled: boolean
}

const formValue = ref<AiConfigForm>({
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: '0.7',
  maxTokens: '2048',
  enabled: true
})

const providerOptions: SelectOption[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Azure OpenAI', value: 'azure' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: '自定义', value: 'custom' }
]

const modelOptions: SelectOption[] = [
  { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
  { label: '自定义模型', value: 'custom' }
]

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await getAiConfig()
    formValue.value = {
      provider: data.provider,
      apiKey: data.apiKey,
      model: data.model,
      temperature: String(data.temperature),
      maxTokens: String(data.maxTokens),
      enabled: data.enabled
    }
  } catch {
    // 接口异常时使用默认配置
  } finally {
    loading.value = false
  }
})

async function saveConfig() {
  saving.value = true
  try {
    await saveAiConfig({
      provider: formValue.value.provider,
      apiKey: formValue.value.apiKey,
      model: formValue.value.model,
      temperature: parseFloat(formValue.value.temperature) || 0.7,
      maxTokens: parseInt(formValue.value.maxTokens) || 2048,
      enabled: formValue.value.enabled
    })
    message.success('AI 配置已保存')
  } catch {
    message.error('保存失败，请检查网络或后端服务')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="ai-config-page">
    <n-card title="AI 接入配置">
      <template #header-extra>
        <n-icon :size="20" color="#E58A2E">
          <Cpu />
        </n-icon>
      </template>
      <n-spin :show="loading">
        <n-form label-placement="left" label-width="120px" :model="formValue">
          <n-form-item label="启用 AI">
            <n-switch v-model:value="formValue.enabled" />
          </n-form-item>
          <n-form-item label="服务提供商">
            <n-select v-model:value="formValue.provider" :options="providerOptions" style="width: 280px" />
          </n-form-item>
          <n-form-item label="API Key">
            <n-input v-model:value="formValue.apiKey" type="password" placeholder="请输入 API Key" style="width: 400px" />
          </n-form-item>
          <n-form-item label="模型">
            <n-select v-model:value="formValue.model" :options="modelOptions" style="width: 280px" />
          </n-form-item>
          <n-form-item label="Temperature">
            <n-input v-model:value="formValue.temperature" style="width: 120px" />
          </n-form-item>
          <n-form-item label="Max Tokens">
            <n-input v-model:value="formValue.maxTokens" style="width: 120px" />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" :loading="saving" :disabled="loading" @click="saveConfig">
              <template #icon>
                <Save :size="16" />
              </template>
              保存配置
            </n-button>
          </n-form-item>
        </n-form>
      </n-spin>
    </n-card>
  </div>
</template>

<style scoped>
.ai-config-page {
  max-width: 800px;
}
</style>
