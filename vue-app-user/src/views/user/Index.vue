<template>
  <main>
    <!-- Hero -->
    <section class="hero">
      <img src="/assets/hero-main.jpg" alt="现代团队协作办公场景" class="hero-bg" />
      <div class="hero-overlay" />
      <div class="hero-content">
        <h1 class="oak-h1 hero-title">让 AI 与知识库驱动高效办公</h1>
        <p class="hero-desc">
          一体化 OA 平台，融合智能助手与企业知识库，让流程审批、协作沟通、数据洞察触手可及。
        </p>
        <n-space justify="center" :size="16" class="hero-actions">
          <n-button type="primary" size="large" @click="goHome">免费试用</n-button>
          <n-button ghost size="large" class="hero-ghost" @click="goKb">了解更多</n-button>
        </n-space>
      </div>
    </section>

    <!-- Features -->
    <section class="section features">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="oak-h2">核心能力</h2>
          <p class="oak-body-large mt-3">为现代办公场景打造的全栈解决方案</p>
        </div>
        <n-grid cols="1 s:2 l:4" :x-gap="24" :y-gap="24" responsive="screen">
          <n-grid-item v-for="item in features" :key="item.title">
            <n-card class="feature-card" hoverable>
              <div class="feature-icon">
                <component :is="item.icon" :size="24" />
              </div>
              <h3 class="oak-h3 feature-title">{{ item.title }}</h3>
              <p class="oak-body mt-2">{{ item.desc }}</p>
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>
    </section>

    <!-- Stats -->
    <section class="section stats-section">
      <div class="section-inner">
        <n-grid cols="2 s:2 l:4" :x-gap="24" :y-gap="24" responsive="screen">
          <n-grid-item v-for="stat in stats" :key="stat.label" class="stat-cell">
            <div class="stat-number">{{ stat.value }}</div>
            <p class="oak-body mt-1">{{ stat.label }}</p>
          </n-grid-item>
        </n-grid>
      </div>
    </section>

    <!-- Data insight preview -->
    <section class="section chart-section">
      <div class="section-inner">
        <n-card title="数据洞察预览" class="chart-card">
          <div class="chart-wrapper">
            <EChart :option="chartOption" />
          </div>
        </n-card>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta">
      <div class="section-inner text-center">
        <h2 class="oak-h2">准备好升级办公体验？</h2>
        <p class="oak-body-large mt-4">立即加入 Oak OA，让 AI 成为团队的超级助手，开启高效协作新篇章。</p>
        <n-button type="primary" size="large" class="mt-8" @click="goHome">立即开始</n-button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NSpace, NGrid, NGridItem, NCard } from 'naive-ui'
import { Bot, BookOpen, ListChecks, BarChart3 } from 'lucide-vue-next'
import EChart from '@/components/EChart.vue'
import type { Component } from 'vue'
import type { EChartsCoreOption } from 'echarts'

interface FeatureItem {
  title: string
  desc: string
  icon: Component
}

interface StatItem {
  value: string
  label: string
}

const router = useRouter()
const goHome = () => router.push('/home')
const goKb = () => router.push('/kb')

const features: FeatureItem[] = [
  { title: 'AI 智能助手', desc: '自然语言问答、智能续写、任务提醒，让每位员工都拥有一位 7×24 的办公助理。', icon: Bot },
  { title: '企业知识库', desc: '集中沉淀制度、文档与经验，支持全文检索与权限管理，构建组织专属知识体系。', icon: BookOpen },
  { title: '流程审批', desc: '可视化流程设计、灵活表单与多级审批，随时随地发起、审批与追踪业务流。', icon: ListChecks },
  { title: '数据洞察', desc: '实时汇总人、事、流程数据，通过智能看板辅助管理层快速洞察业务趋势。', icon: BarChart3 }
]

const stats: StatItem[] = [
  { value: '10k+', label: '企业员工' },
  { value: '500+', label: '落地企业' },
  { value: '30%', label: '审批效率提升' },
  { value: '99.9%', label: '平台可用性' }
]

const chartOption: EChartsCoreOption = {
  color: ['#E58A2E', '#34A853', '#2E90FA', '#F5B800'],
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value' },
  series: [
    { name: '审批完成量', type: 'bar', data: [120, 132, 101, 134, 90, 230] },
    { name: '知识库访问', type: 'line', smooth: true, data: [220, 182, 191, 234, 290, 330] }
  ]
}
</script>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 520px;
  overflow: hidden;
}
@media (min-width: 768px) {
  .hero { height: 620px; }
}
.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(229, 138, 46, 0.8), rgba(42, 38, 31, 0.55), rgba(229, 138, 46, 0.35));
}
.hero-content {
  position: relative;
  z-index: 10;
  max-width: 1024px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  text-align: center;
}
.hero-title {
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.hero-desc {
  margin-top: 20px;
  max-width: 640px;
  font-size: 18px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.9);
}
.hero-actions {
  margin-top: 32px;
}
.hero-ghost {
  color: #fff !important;
  border-color: rgba(255,255,255,0.4) !important;
  background: rgba(255,255,255,0.1) !important;
}
.section {
  padding: 64px 24px;
}
@media (min-width: 768px) {
  .section { padding: 96px 24px; }
}
.section-inner {
  max-width: 1280px;
  margin: 0 auto;
}
.section-header {
  text-align: center;
  margin-bottom: 48px;
}
.features {
  background: var(--oak-background);
}
.feature-card {
  border: 1px solid var(--oak-line);
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--oak-shadow-2);
}
.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--oak-muted);
  color: var(--oak-primary);
  margin-bottom: 16px;
}
.feature-title {
  font-size: 18px;
}
.stats-section {
  background: var(--oak-muted);
  padding: 56px 24px;
}
.stat-cell {
  text-align: center;
}
.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--oak-primary);
  letter-spacing: -0.02em;
}
.chart-section {
  background: var(--oak-background);
  padding-top: 48px;
  padding-bottom: 48px;
}
.chart-card {
  border: 1px solid var(--oak-line);
  border-radius: 12px;
}
.chart-wrapper {
  width: 100%;
  height: 320px;
}
.cta {
  background: var(--oak-background);
  text-align: center;
}
.text-center {
  text-align: center;
}
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-8 { margin-top: 32px; }
</style>
