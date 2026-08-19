<template>
  <div ref="chartRef" class="echart-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsCoreOption } from 'echarts'

interface Props {
  option?: EChartsCoreOption
}

const props = withDefaults(defineProps<Props>(), {
  option: () => ({})
})

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(props.option, true)
}

const resizeChart = () => {
  chartInstance && chartInstance.resize()
}

onMounted(() => {
  nextTick(initChart)
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(() => props.option, (newOption) => {
  if (chartInstance) {
    chartInstance.setOption(newOption, true)
  }
}, { deep: true })
</script>

<style scoped>
.echart-container {
  width: 100%;
  height: 100%;
  min-height: 240px;
}
</style>
