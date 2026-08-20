<template>
  <main class="ai-main">
    <!-- Sidebar -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="0"
      :width="280"
      show-trigger="arrow-circle"
      class="ai-sider"
    >
      <div class="sider-inner">
        <n-button type="primary" block class="new-chat-btn" @click="aiStore.createSession">
          <template #icon><Plus :size="16" /></template>
          新建对话
        </n-button>
        <div class="session-list">
          <template v-if="todaySessions.length">
            <p class="group-title">今天</p>
            <n-button
              v-for="session in todaySessions"
              :key="session.id"
              quaternary
              block
              :type="session.active ? 'primary' : 'default'"
              class="session-btn"
              @click="aiStore.selectSession(session.id)"
            >
              {{ session.title }}
            </n-button>
          </template>
          <template v-if="yesterdaySessions.length">
            <p class="group-title">昨天</p>
            <n-button
              v-for="session in yesterdaySessions"
              :key="session.id"
              quaternary
              block
              :type="session.active ? 'primary' : 'default'"
              class="session-btn"
              @click="aiStore.selectSession(session.id)"
            >
              {{ session.title }}
            </n-button>
          </template>
          <template v-if="earlierSessions.length">
            <p class="group-title">更早</p>
            <n-button
              v-for="session in earlierSessions"
              :key="session.id"
              quaternary
              block
              :type="session.active ? 'primary' : 'default'"
              class="session-btn"
              @click="aiStore.selectSession(session.id)"
            >
              {{ session.title }}
            </n-button>
          </template>
          <p v-if="!aiStore.sessions.length" class="group-title" style="opacity:.6">暂无历史会话</p>
        </div>
      </div>
    </n-layout-sider>

    <!-- Chat area -->
    <section class="chat-section">
      <!-- Header -->
      <div class="chat-header">
        <n-space align="center" :size="12">
          <div class="ai-avatar">
            <Bot :size="18" />
          </div>
          <div>
            <h1 class="oak-h3" style="font-size: 16px;">Oak AI 助手</h1>
            <n-space align="center" :size="6">
              <span class="online-dot" />
              <span class="oak-caption">在线</span>
            </n-space>
          </div>
        </n-space>
        <n-button quaternary circle>
          <template #icon><Settings :size="16" /></template>
        </n-button>
      </div>

      <!-- Messages -->
      <div ref="scrollRef" class="chat-messages">
        <div class="messages-inner">
          <!-- Welcome -->
          <div v-if="aiStore.messages.length === 0" class="welcome">
            <div class="ai-avatar welcome-avatar">
              <Sparkles :size="28" />
            </div>
            <h2 class="oak-h2" style="font-size: 24px;">你好，我是 Oak AI 助手</h2>
            <p class="oak-body-large mt-2">有什么可以帮你的？</p>
            <n-space justify="center" wrap class="quick-prompts">
              <n-button
                v-for="prompt in quickPrompts"
                :key="prompt"
                round
                class="quick-btn"
                @click="sendQuick(prompt)"
              >
                {{ prompt }}
              </n-button>
            </n-space>
          </div>

          <!-- Message list -->
          <div v-for="msg in aiStore.messages" :key="msg.id" class="message-row" :class="msg.role">
            <template v-if="msg.role === 'user'">
              <div class="user-bubble">
                <p class="msg-text">{{ msg.content }}</p>
              </div>
            </template>
            <template v-else>
              <div class="ai-avatar">
                <Bot :size="16" />
              </div>
              <div class="ai-bubble">
                <!-- Agent 回复：Markdown 实时渲染，流式时末尾显示闪烁光标 -->
                <MarkdownRender :content="msg.content" :streaming="msg.streaming" />
              </div>
            </template>
          </div>

          <!-- Typing indicator：仅在等待首个 token 时显示（流式已产出 token 后由 streaming 消息自带光标） -->
          <div v-if="aiStore.isTyping && !hasStreamingMessage" class="message-row assistant">
            <div class="ai-avatar"><Bot :size="16" /></div>
            <div class="ai-bubble">
              <div class="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input-area">
        <div class="input-inner">
          <n-space align="center" class="input-box">
            <n-button quaternary circle>
              <template #icon><Paperclip :size="18" /></template>
            </n-button>
            <n-input
              v-model:value="inputText"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              :placeholder="aiStore.isTyping ? 'AI 正在回复...' : '输入消息...'"
              :disabled="aiStore.isTyping"
              class="chat-input"
              @keydown.enter.prevent="sendMessage"
            />
            <n-button
              v-if="aiStore.isTyping"
              circle
              type="error"
              title="停止生成"
              @click="aiStore.stopStreaming"
            >
              <template #icon><Square :size="14" /></template>
            </n-button>
            <n-button v-else circle type="primary" :disabled="!inputText.trim()" @click="sendMessage">
              <template #icon><ArrowUp :size="16" /></template>
            </n-button>
          </n-space>
          <p class="oak-caption input-tip">AI 生成内容仅供参考，请核实重要信息。</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted } from 'vue'
import {
  NLayoutSider, NButton, NSpace, NInput
} from 'naive-ui'
import {
  Plus, Bot, Settings, Sparkles, Paperclip, ArrowUp, Square
} from 'lucide-vue-next'
import { useAiStore } from '@/stores'
import MarkdownRender from '@/components/MarkdownRender.vue'
import type { AiSession } from '@/types'

const aiStore = useAiStore()
const inputText = ref('')
const scrollRef = ref<HTMLElement | null>(null)

// 会话列表按 updatedAt/createdAt 分组（今天/昨天/更早）
const toDateKey = (iso?: string) => {
  if (!iso) return 'earlier'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'earlier'
  const today = new Date()
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const yesterday0 = today0 - 86400000
  const t = d.getTime()
  if (t >= today0) return 'today'
  if (t >= yesterday0) return 'yesterday'
  return 'earlier'
}

const todaySessions = computed<AiSession[]>(() =>
  aiStore.sessions.filter((s) => toDateKey(s.updatedAt || s.createdAt) === 'today'),
)
const yesterdaySessions = computed<AiSession[]>(() =>
  aiStore.sessions.filter((s) => toDateKey(s.updatedAt || s.createdAt) === 'yesterday'),
)
const earlierSessions = computed<AiSession[]>(() =>
  aiStore.sessions.filter((s) => toDateKey(s.updatedAt || s.createdAt) === 'earlier'),
)

// 是否存在流式进行中的消息（决定 typing-dots 是否显示）
const hasStreamingMessage = computed(() => aiStore.messages.some((m) => m.streaming))

const quickPrompts = ['帮我写一份周报', '查询公司报销流程', '总结这份文档']

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight
    }
  })
}

watch(() => aiStore.messages.length, scrollToBottom, { immediate: true })
watch(() => aiStore.isTyping, scrollToBottom)
// 流式 token 累积时持续滚到底
watch(
  () => aiStore.messages.map((m) => m.content).join(''),
  () => scrollToBottom(),
)

onMounted(() => {
  aiStore.loadSessions()
})

const sendMessage = () => {
  const text = inputText.value.trim()
  if (!text || aiStore.isTyping) return
  inputText.value = ''
  aiStore.sendMessage(text)
}

const sendQuick = (prompt: string) => {
  aiStore.sendMessage(prompt)
}
</script>

<style scoped>
.ai-main {
  display: flex;
  min-height: calc(100vh - 64px);
}
.ai-sider {
  background: var(--oak-surface-2);
}
.sider-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.new-chat-btn {
  margin-bottom: 12px;
}
.session-list {
  flex: 1;
  overflow-y: auto;
}
.group-title {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--oak-ink-3);
}
.session-btn {
  justify-content: flex-start;
  margin-bottom: 4px;
}
.chat-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--oak-background);
}
.chat-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--oak-line);
}
.ai-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(229, 138, 46, 0.1);
  color: var(--oak-primary);
  flex-shrink: 0;
}
.welcome-avatar {
  width: 48px;
  height: 48px;
}
.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--oak-state-success);
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.messages-inner {
  max-width: 768px;
  margin: 0 auto;
}
.welcome {
  text-align: center;
  padding: 48px 0;
}
.quick-prompts {
  margin-top: 24px;
}
.quick-btn {
  border-radius: 9999px;
  border: 1px solid var(--oak-line);
  background: var(--oak-card);
}
.quick-btn:hover {
  border-color: var(--oak-primary);
  color: var(--oak-primary);
}
.message-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.message-row.user {
  justify-content: flex-end;
}
.user-bubble {
  max-width: 80%;
  padding: 12px 18px;
  border-radius: 20px;
  border-top-right-radius: 4px;
  background: var(--oak-primary);
  color: var(--oak-primary-foreground);
  box-shadow: var(--oak-shadow-1);
}
.ai-bubble {
  max-width: 80%;
  padding: 12px 18px;
  border-radius: 20px;
  border-top-left-radius: 4px;
  border: 1px solid var(--oak-line);
  background: var(--oak-card);
  color: var(--oak-ink);
  box-shadow: var(--oak-shadow-1);
}
.msg-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}
.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 20px;
}
.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--oak-ink-3);
  animation: bounce 1.4s ease-in-out infinite both;
}
.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
.chat-input-area {
  border-top: 1px solid var(--oak-line);
  background: var(--oak-surface);
  padding: 12px 24px;
}
.input-inner {
  max-width: 768px;
  margin: 0 auto;
}
.input-box {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--oak-line);
  border-radius: 20px;
  background: var(--oak-card);
  box-shadow: var(--oak-shadow-1);
}
.chat-input {
  flex: 1;
}
.chat-input :deep(.n-input__textarea-el) {
  background: transparent;
  resize: none;
}
.input-tip {
  text-align: center;
  margin-top: 8px;
}
</style>
