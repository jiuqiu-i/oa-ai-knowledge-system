<template>
  <component
    :is="tag"
    class="typewriter-text"
    :class="{ 'typing-cursor': isTyping }"
    style="white-space: pre-wrap"
  >
    {{ displayedText }}
  </component>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  text?: string
  speed?: number
  tag?: string
  startOnMount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  speed: 45,
  tag: 'span',
  startOnMount: true
})

const emit = defineEmits<{
  done: []
}>()

const displayedText = ref('')
const isTyping = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let index = 0

const typeNext = () => {
  if (index < props.text.length) {
    displayedText.value += props.text.charAt(index)
    index += 1
    timer = setTimeout(typeNext, props.speed)
  } else {
    isTyping.value = false
    emit('done')
  }
}

const startTyping = () => {
  if (timer) clearTimeout(timer)
  displayedText.value = ''
  index = 0
  isTyping.value = true
  typeNext()
}

onMounted(() => {
  if (props.startOnMount) startTyping()
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

watch(() => props.text, () => {
  startTyping()
}, { immediate: false })
</script>

<style scoped>
.typing-cursor::after {
  content: '|';
  display: inline-block;
  margin-left: 2px;
  color: var(--oak-primary);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
