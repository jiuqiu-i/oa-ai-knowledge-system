<template>
  <main class="kb-main">
    <!-- Search hero -->
    <section class="search-hero">
      <div class="search-inner">
        <h1 class="oak-h1 mb-3">知识库</h1>
        <p class="oak-body-large mb-8">发现、搜索与共享团队沉淀的知识与文档</p>
        <div class="search-box">
          <n-input
            v-model:value="searchInput"
            placeholder="搜索文档、知识、问题..."
            size="large"
            class="search-input"
            @keyup.enter="performSearch"
          >
            <template #prefix>
              <Search :size="18" class="search-icon" />
            </template>
          </n-input>
          <n-button type="primary" size="large" class="search-btn" @click="performSearch">
            搜索
          </n-button>
        </div>

        <!-- Search results -->
        <div v-if="showResults" class="results-area">
          <div class="results-bar">
            <p class="oak-body">找到 <span class="result-count">{{ kbStore.sortedDocs.length }}</span> 条结果</p>
            <n-space align="center">
              <span class="oak-caption">排序</span>
              <n-select v-model:value="kbStore.sortBy" :options="sortOptions" size="small" style="width: 120px;" />
            </n-space>
          </div>
          <n-empty v-if="kbStore.sortedDocs.length === 0" description="未找到相关文档，换个关键词试试">
            <template #icon>
              <FileX :size="48" />
            </template>
          </n-empty>
          <n-space v-else vertical :size="12">
            <n-card
              v-for="doc in kbStore.sortedDocs"
              :key="doc.id"
              hoverable
              class="result-card"
              @click="viewDoc(doc)"
            >
              <n-space align="start">
                <div class="doc-icon">
                  <component :is="iconMap[doc.icon] || FileText" :size="20" />
                </div>
                <div class="doc-body">
                  <h3 class="oak-h3" style="font-size: 16px;" v-html="highlight(doc.title)" />
                  <p class="oak-body mt-1" v-html="highlight(doc.summary)" />
                  <n-space :size="12" class="doc-meta">
                    <n-tag v-for="tag in [doc.category, ...doc.tags]" :key="tag" size="small" round>
                      <span v-html="highlight(tag)" />
                    </n-tag>
                    <span class="oak-caption"><User :size="12" /> <span v-html="highlight(doc.author)" /></span>
                    <span class="oak-caption"><Clock :size="12" /> {{ doc.updated }}</span>
                    <span class="oak-caption"><Eye :size="12" /> {{ doc.views }}</span>
                  </n-space>
                </div>
              </n-space>
            </n-card>
          </n-space>
        </div>

        <!-- Hot tags -->
        <div v-if="!showResults" class="hot-tags">
          <span class="oak-caption">热门搜索：</span>
          <n-tag
            v-for="tag in hotTags"
            :key="tag"
            round
            class="hot-tag"
            @click="useHotTag(tag)"
          >
            {{ tag }}
          </n-tag>
        </div>
      </div>
    </section>

    <!-- Content area -->
    <section v-if="!showResults" class="content-area">
      <div class="content-inner">
        <!-- Sidebar -->
        <aside class="sidebar">
          <n-card class="sidebar-card" :bordered="true">
            <h3 class="oak-h3 mb-4" style="font-size: 16px;">知识分类</h3>
            <n-space vertical :size="4">
              <n-button
                v-for="cat in kbStore.categories"
                :key="cat.key"
                quaternary
                :type="kbStore.activeCategory === cat.key ? 'primary' : 'default'"
                class="cat-btn"
                @click="kbStore.activeCategory = cat.key"
              >
                <template #icon>
                  <component :is="iconMap[cat.icon] || FolderOpen" :size="16" />
                </template>
                {{ cat.label }}
              </n-button>
            </n-space>
          </n-card>
          <n-card class="sidebar-card" :bordered="true">
            <h3 class="oak-h3 mb-3" style="font-size: 16px;">标签</h3>
            <n-space :size="8" wrap>
              <n-tag v-for="tag in kbStore.tags" :key="tag" size="small" @click="useHotTag(tag.replace('# ', ''))">
                # {{ tag }}
              </n-tag>
            </n-space>
          </n-card>
        </aside>

        <!-- Main -->
        <div class="main-area">
          <section class="doc-section" v-if="false">
            <div class="section-bar">
              <h2 class="oak-h2" style="font-size: 20px;">热门知识</h2>
              <n-button text type="primary" @click="viewAllHot">查看全部</n-button>
            </div>
            <n-empty v-if="hotDocs.length === 0" description="暂无热门文档" size="small" />
            <n-grid v-else cols="1 s:2 xl:3" :x-gap="16" :y-gap="16" responsive="screen">
              <n-grid-item v-for="doc in hotDocs" :key="doc.id">
                <n-card hoverable class="doc-card" @click="viewDoc(doc)">
                  <n-space align="start" justify="space-between">
                    <div class="doc-icon">
                      <component :is="iconMap[doc.icon] || FileText" :size="20" />
                    </div>
                    <span class="oak-caption"><Eye :size="14" /> {{ doc.views }}</span>
                  </n-space>
                  <h3 class="oak-h3 mt-3" style="font-size: 16px;">{{ doc.title }}</h3>
                  <p class="oak-body mt-2 line-clamp">{{ doc.summary }}</p>
                  <n-space :size="8" class="mt-3">
                    <n-tag v-for="tag in [doc.category, ...doc.tags]" :key="tag" size="small" round>{{ tag }}</n-tag>
                  </n-space>
                  <div class="doc-footer">
                    <n-space align="center" :size="8">
                      <n-avatar round size="small" :style="{ background: 'var(--oak-primary)', color: '#fff' }">{{ doc.author.charAt(0) }}</n-avatar>
                      <span class="oak-caption">{{ doc.author }}</span>
                    </n-space>
                    <span class="oak-caption">{{ doc.updated }}</span>
                  </div>
                </n-card>
              </n-grid-item>
            </n-grid>
          </section>

          <section class="doc-section">
            <div class="section-bar">
              <h2 class="oak-h2" style="font-size: 20px;">最近更新</h2>
              <n-button text type="primary" @click="viewAllRecent">查看全部</n-button>
            </div>
            <n-empty v-if="recentDocs.length === 0" description="暂无文档" size="small" />
            <n-grid v-else cols="1 s:2 xl:3" :x-gap="16" :y-gap="16" responsive="screen">
              <n-grid-item v-for="doc in recentDocs" :key="doc.id">
                <n-card hoverable class="doc-card" @click="viewDoc(doc)">
                  <n-space align="start" justify="space-between">
                    <div class="doc-icon">
                      <component :is="iconMap[doc.icon] || FileText" :size="20" />
                    </div>
                    <span class="oak-caption"><Eye :size="14" /> {{ doc.views }}</span>
                  </n-space>
                  <h3 class="oak-h3 mt-3" style="font-size: 16px;">{{ doc.title }}</h3>
                  <p class="oak-body mt-2 line-clamp">{{ doc.summary }}</p>
                  <n-space :size="8" class="mt-3">
                    <n-tag v-for="tag in [doc.category, ...doc.tags]" :key="tag" size="small" round>{{ tag }}</n-tag>
                  </n-space>
                  <div class="doc-footer">
                    <n-space align="center" :size="8">
                      <n-avatar round size="small" :style="{ background: 'var(--oak-primary)', color: '#fff' }">{{ doc.author.charAt(0) }}</n-avatar>
                      <span class="oak-caption">{{ doc.author }}</span>
                    </n-space>
                    <span class="oak-caption">{{ doc.updated }}</span>
                  </div>
                </n-card>
              </n-grid-item>
            </n-grid>
          </section>
        </div>
      </div>
    </section>

    <!-- Doc detail drawer -->
    <n-drawer v-model:show="docDetailVisible" :width="560" placement="right">
      <n-drawer-content v-if="activeDoc" :title="activeDoc.title" closable>
        <div class="detail-inner">
          <n-space vertical :size="16">
            <n-space :size="12" wrap>
              <n-tag round size="small" type="primary">{{ activeDoc.category }}</n-tag>
              <n-tag v-for="tag in activeDoc.tags" :key="tag" size="small" round>{{ tag }}</n-tag>
              <n-space align="center" :size="4" class="oak-caption">
                <Eye :size="12" /> {{ activeDoc.views }} 次阅读
              </n-space>
            </n-space>
            <n-space align="center" :size="10">
              <n-avatar round size="small" :style="{ background: 'var(--oak-primary)', color: '#fff' }">
                {{ activeDoc.author.charAt(0) }}
              </n-avatar>
              <span class="oak-body">{{ activeDoc.author }}</span>
              <span class="oak-caption">更新于 {{ activeDoc.updated }}</span>
            </n-space>
            <div v-if="activeDoc.summary" class="doc-summary">
              {{ activeDoc.summary }}
            </div>
            <n-divider />
            <div>
              <div class="oak-h3 detail-section-title">简介 / 摘要</div>
              <div class="doc-body">
                {{ activeDoc.summary || activeDoc.content || '（该文档暂未提供详情内容）' }}
              </div>
            </div>
          </n-space>
        </div>
      </n-drawer-content>
    </n-drawer>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Component } from 'vue'
import {
  NInput, NButton, NCard, NGrid, NGridItem, NSpace, NTag,
  NSelect, NEmpty, NAvatar, NDrawer, NDrawerContent, NDivider, useMessage
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import {
  Search, FileX, FileText, Code, Rocket, ShieldCheck,
  Banknote, Phone, FolderOpen, Box, Code2, TrendingUp,
  Users, HelpCircle, Eye, Clock, User
} from 'lucide-vue-next'
import { useKbStore } from '@/stores'
import { getDocDetail } from '@/api/kb'
import type { KbDoc } from '@/types'

const kbStore = useKbStore()
const message = useMessage()
const searchInput = ref('')
const showResults = computed(() => kbStore.keyword.trim().length > 0)

// 进入页面时拉取后端文档与分类
onMounted(() => {
  kbStore.fetchDocs()
  kbStore.fetchCategories()
  kbStore.fetchHotDocs()
})

const iconMap: Record<string, Component> = {
  FileText, Code, Rocket, ShieldCheck, Banknote, Phone,
  FolderOpen, Box, Code2, TrendingUp, Users, HelpCircle
}

const sortOptions: SelectOption[] = [
  { label: '相关度', value: 'relevance' },
  { label: '最新', value: 'latest' },
  { label: '最热', value: 'hottest' }
]

const hotTags = ['入职指南', '前端开发规范', '报销规范', 'FAQ']

const performSearch = async () => {
  const kw = searchInput.value.trim()
  kbStore.search(kw)
  // 优先走后端全文检索
  try {
    await kbStore.fetchDocs({ keyword: kw })
  } catch {
    message.warning('后端搜索不可用，已切换本地筛选')
  }
}

const useHotTag = (tag: string) => {
  searchInput.value = tag
  performSearch()
}

const highlight = (text: string): string => {
  return kbStore.highlight(text, kbStore.keyword)
}

const viewAllHot = () => {
  // 切到最热排序 + 全部分类，并滚动到文档列表
  kbStore.activeCategory = 'all'
  kbStore.sortBy = 'hottest'
  if (!showResults.value) {
    const el = document.querySelector('.main-area')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const viewAllRecent = () => {
  kbStore.activeCategory = 'all'
  kbStore.sortBy = 'latest'
  if (!showResults.value) {
    const el = document.querySelector('.main-area')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const hotDocs = computed<KbDoc[]>(() => {
  // 有热门就用热门，否则退回到 docs 里按 views 排前 6
  if (kbStore.hotDocs.length > 0) return kbStore.hotDocs.slice(0, 6)
  return [...kbStore.filteredDocs].sort((a, b) => {
    const pa = parseFloat(String(a.views).replace(/[^0-9.]/g, '')) * (String(a.views).includes('k') ? 1000 : 1)
    const pb = parseFloat(String(b.views).replace(/[^0-9.]/g, '')) * (String(b.views).includes('k') ? 1000 : 1)
    return pb - pa
  }).slice(0, 6)
})

const recentDocs = computed<KbDoc[]>(() => {
  const sorted = [...kbStore.filteredDocs].sort((a, b) => a.updatedOrder - b.updatedOrder)
  return sorted.slice(0, 6)
})

// ---------- 文档详情抽屉 ----------
const docDetailVisible = ref(false)
const activeDoc = ref<KbDoc | null>(null)

const viewDoc = async (doc: KbDoc) => {
  activeDoc.value = doc
  docDetailVisible.value = true
  // 尝试加载详情（追加 content）
  try {
    const { data } = await getDocDetail(String(doc.id))
    if (activeDoc.value?.id === doc.id) {
      activeDoc.value = {
        ...activeDoc.value,
        summary: data.summary || activeDoc.value.summary,
        content: data.content || activeDoc.value.content,
        views: data.views != null ? (data.views >= 1000 ? `${(data.views / 1000).toFixed(1)}k` : String(data.views)) : activeDoc.value.views
      } as KbDoc
    }
  } catch {
    // 详情加载失败不阻塞查看
  }
}

// 给 KbDoc 增加 content 字段（视图模型中没有，但详情展示需要）
declare module '@/types' {
  interface KbDoc {
    content?: string
  }
}
</script>

<style scoped>
.kb-main {
  background: var(--oak-background);
}
.search-hero {
  border-bottom: 1px solid var(--oak-line);
  background: var(--oak-surface);
  padding: 48px 24px;
}
@media (min-width: 768px) {
  .search-hero { padding: 64px 24px; }
}
.search-inner {
  max-width: 768px;
  margin: 0 auto;
  text-align: center;
}
.search-box {
  position: relative;
  display: flex;
  gap: 8px;
}
.search-input {
  flex: 1;
}
.search-icon {
  color: var(--oak-ink-3);
}
.search-btn {
  flex-shrink: 0;
}
.results-area {
  margin-top: 24px;
  text-align: left;
}
.results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}
.result-count {
  font-weight: 600;
  color: var(--oak-ink);
}
.result-card {
  border: 1px solid var(--oak-line);
  border-radius: 12px;
  cursor: pointer;
}
.result-card:hover {
  border-color: rgba(229, 138, 46, 0.4);
}
.hot-tags {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.hot-tag {
  cursor: pointer;
}
.content-area {
  padding: 32px 24px;
}
.content-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  gap: 32px;
}
.sidebar {
  display: none;
  width: 240px;
  flex-shrink: 0;
  flex-direction: column;
  gap: 24px;
}
@media (min-width: 768px) {
  .sidebar { display: flex; }
}
.sidebar-card {
  border: 1px solid var(--oak-line);
  border-radius: 12px;
}
.cat-btn {
  justify-content: flex-start;
  width: 100%;
}
.main-area {
  min-width: 0;
  flex: 1;
}
.doc-section {
  margin-bottom: 40px;
}
.section-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.doc-card {
  border: 1px solid var(--oak-line);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.doc-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--oak-shadow-2);
}
.doc-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--oak-muted);
  color: var(--oak-primary);
}
.doc-body {
  min-width: 0;
  flex: 1;
}
.doc-meta {
  margin-top: 8px;
}
.doc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--oak-line);
}
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mb-3 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 32px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
:deep(.search-highlight) {
  background-color: color-mix(in srgb, var(--oak-primary) 22%, transparent);
  color: var(--oak-ink);
  border-radius: 2px;
  padding: 0 2px;
}
</style>
