<template>
  <!-- 思考/流式过程中：纯文本预览 + 打字机光标 -->
  <div v-if="streaming" class="streaming-preview">{{ content }}<span class="type-cursor" /></div>
  <!-- 最终结果：Markdown 渲染 -->
  <div v-else class="markdown-body" v-html="renderedHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Marked } from 'marked'
import DOMPurify from 'dompurify'

interface Props {
  content: string
  /** 流式输出进行中：纯文本打字机预览，不做 Markdown 解析 */
  streaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  streaming: false,
})

// 独立 Marked 实例，避免污染全局
const markdown = new Marked()
markdown.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * 仅在非流式阶段计算最终 HTML。
 * 流式期间模板直接展示纯文本 + 光标，不触发 marked（避免半截 markdown 解析错乱）。
 * 使用 computed 保证 streaming 变为 false 时必然重新计算。
 */
const renderedHtml = computed(() => {
  if (props.streaming) return ''
  if (!props.content) return ''
  const raw = markdown.parse(props.content, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
})
</script>

<style scoped>
/* 思考过程预览：纯文本打字机效果 */
.streaming-preview {
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--oak-ink-2, var(--oak-ink));
}
.type-cursor {
  display: inline-block;
  width: 7px;
  height: 1em;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: var(--oak-primary);
  animation: stream-blink 1s step-end infinite;
}
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
/* 流式输出打字机光标动画 */
@keyframes stream-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
