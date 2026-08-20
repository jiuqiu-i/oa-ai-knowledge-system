<template>
  <div class="markdown-body" :class="{ streaming }" v-html="sanitizedHtml" />
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface Props {
  content: string
  /** 流式输出进行中：禁用代码高亮等重计算，仅保证文本安全追加 */
  streaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  streaming: false,
})

// marked 配置：开启 GFM、换行转 <br>（聊天场景常见）
marked.setOptions({
  gfm: true,
  breaks: true,
})

// 流式期间频繁重渲染，用 ref 缓存上一次结果，避免未变化时重复 sanitize
const sanitizedHtml = ref('')

const render = () => {
  if (!props.content) {
    sanitizedHtml.value = ''
    return
  }
  const raw = marked.parse(props.content, { async: false }) as string
  // DOMPurify 清洗 XSS：禁用危险标签/属性，保留代码块与基础排版
  sanitizedHtml.value = DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

// 深度监听 content（流式 token 累积触发）
watch(() => props.content, render, { immediate: true })
</script>

<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}
.markdown-body :deep(p) {
  margin: 0 0 8px;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.4;
}
.markdown-body :deep(h1) { font-size: 18px; }
.markdown-body :deep(h2) { font-size: 16px; }
.markdown-body :deep(h3) { font-size: 15px; }
.markdown-body :deep(h4) { font-size: 14px; }
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 6px 0;
  padding-left: 22px;
}
.markdown-body :deep(li) {
  margin: 2px 0;
}
.markdown-body :deep(a) {
  color: var(--oak-primary);
  text-decoration: none;
}
.markdown-body :deep(a:hover) {
  text-decoration: underline;
}
.markdown-body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--oak-surface-2);
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 13px;
}
.markdown-body :deep(pre) {
  margin: 8px 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--oak-surface-2);
  overflow-x: auto;
}
.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  font-size: 13px;
  line-height: 1.6;
}
.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid var(--oak-line);
  color: var(--oak-ink-3);
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--oak-line);
  padding: 6px 10px;
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--oak-surface-2);
  font-weight: 600;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--oak-line);
  margin: 12px 0;
}
/* 流式输出光标：附在内容末尾，避免块级换行 */
.markdown-body.streaming :deep(p:last-child)::after,
.markdown-body.streaming :deep(pre:last-child)::after {
  content: '';
  display: inline-block;
  width: 7px;
  height: 1em;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: var(--oak-primary);
  animation: stream-blink 1s step-end infinite;
}
@keyframes stream-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
