<script setup lang="ts">
import { ref, computed, h, onMounted, watch, nextTick } from 'vue'
import type { DataTableColumns, FormInst, FormRules, TreeOption, SelectOption, UploadFileInfo } from 'naive-ui'
import {
  NCard,
  NInput,
  NButton,
  NSelect,
  NTree,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NUpload,
  NUploadDragger,
  NText,
  NSpace,
  NIcon,
  NTag,
  NPagination,
  NDrawer,
  NDrawerContent,
  NAvatar,
  NEmpty,
  NDivider,
  NSpin,
  useMessage
} from 'naive-ui'
import {
  Search,
  FolderPlus,
  Upload,
  Plus,
  Folder,
  FolderX,
  Eye,
  Pencil,
  Trash2,
  UploadCloud,
  RefreshCw
} from 'lucide-vue-next'
import type { KbDoc, KbDocStatus } from '@/types'
import { useKbStore } from '@/stores'
import { getKbDocumentDetail } from '@/api/kb'

const message = useMessage()
const kbStore = useKbStore()

// 删除确认弹窗
const showDeleteModal = ref(false)
const pendingDeleteDoc = ref<KbDoc | null>(null)

const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const selectedCategoryKey = ref<string | null>(null)

// 后端可达时用真实数据覆盖演示数据
onMounted(() => {
  fetchFromApi()
  kbStore.fetchCategories()
})

// 搜索 / 分类 / 分页变化 -> 重新调后端
watch([searchKeyword, selectedCategoryKey, page, pageSize], () => {
  fetchFromApi()
})

function fetchFromApi() {
  const params: Record<string, unknown> = {
    page: page.value,
    pageSize: pageSize.value
  }
  if (searchKeyword.value.trim()) params.keyword = searchKeyword.value.trim()
  // 分类树选中后，把 label（即 category 名称）传给后端
  if (selectedCategoryKey.value) {
    const catLabel = findCategoryLabel(selectedCategoryKey.value)
    if (catLabel) params.category = catLabel
  }
  kbStore.fetchDocuments(params)
}

function resetAndFetch() {
  page.value = 1
  fetchFromApi()
}

// ========== 分类：从 store 拿到 categories 后构造 NTree 需要的 TreeOption[] ==========
const categoryTreeData = computed<TreeOption[]>(() => {
  const cats = kbStore.categories || []
  if (cats.length === 0) {
    // 兜底：若后端还没返回，给一个"全部"占位
    return [{ label: '未分类', key: '_uncategorized_', prefix: () => h(NIcon, { color: '#9F968A' }, { default: () => h(FolderX) }) }]
  }
  return cats.map((c) => ({
    label: c.label,
    key: c.key,
    prefix: () => h(NIcon, { color: '#E58A2E' }, { default: () => h(Folder) })
  }))
})

const categoryFormOptions = computed<SelectOption[]>(() => {
  const cats = kbStore.categories || []
  if (cats.length === 0) {
    return [
      { label: '产品文档', value: '产品文档' },
      { label: '研发规范', value: '研发规范' },
      { label: '销售手册', value: '销售手册' },
      { label: '人事制度', value: '人事制度' },
      { label: '培训资料', value: '培训资料' },
      { label: '未分类', value: '未分类' }
    ]
  }
  return cats.map((c) => ({ label: c.label, value: c.label }))
})

function findCategoryLabel(key: string): string | null {
  const cat = (kbStore.categories || []).find((c) => c.key === key)
  return cat ? cat.label : null
}

function onCategorySelect(keys: Array<string | number>) {
  const key = keys[0] as string | undefined
  selectedCategoryKey.value = key || null
  page.value = 1
}

// ========== 状态 / 列配置 ==========
const statusOptions: SelectOption[] = [
  { label: '已发布', value: '已发布' },
  { label: '草稿', value: '草稿' },
  { label: '已归档', value: '已归档' }
]

function getStatusType(status: KbDocStatus): KbDoc['statusType'] {
  return status === '已发布' ? 'success' : status === '草稿' ? 'warning' : 'default'
}

const tableData = computed<KbDoc[]>(() => kbStore.documents)
const total = computed<number>(() => kbStore.total || kbStore.documents.length)

const columns: DataTableColumns<KbDoc> = [
  { title: '文档名称', key: 'title', render: (row) => h(NButton, { text: true, type: 'primary', onClick: () => viewDoc(row) }, { default: () => row.title }) },
  { title: '所属分类', key: 'category' },
  { title: '作者', key: 'author' },
  { title: '更新时间', key: 'updatedAt' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(NTag, { type: row.statusType as never, size: 'small', round: true }, { default: () => row.status })
    }
  },
  {
    title: '操作',
    key: 'actions',
    align: 'right',
    render(row) {
      return h(NSpace, { size: 4, justify: 'end' }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, onClick: () => viewDoc(row) }, { icon: () => h(Eye, { size: 16 }) }),
          h(NButton, { size: 'small', quaternary: true, onClick: () => openDocModal('edit', row) }, { icon: () => h(Pencil, { size: 16 }) }),
          h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => confirmDelete(row) }, { icon: () => h(Trash2, { size: 16 }) })
        ]
      })
    }
  }
]

// ========== 上传 / 编辑 Modal ==========
const showDocModal = ref(false)
const modalMode = ref<'upload' | 'edit'>('upload')
const editingDoc = ref<KbDoc | null>(null)
const formRef = ref<FormInst | null>(null)
const formValue = ref({
  title: '',
  category: null as string | null,
  status: '已发布' as KbDocStatus,
  content: ''
})
const fileList = ref<UploadFileInfo[]>([])

const rules: FormRules = {
  title: { required: true, message: '请输入文档标题', trigger: 'blur' },
  category: { required: true, message: '请选择分类', trigger: 'change' },
  status: { required: true, message: '请选择状态', trigger: 'change' }
}

function openDocModal(mode: 'upload' | 'edit', row: KbDoc | null = null) {
  modalMode.value = mode
  editingDoc.value = row
  if (mode === 'edit' && row) {
    formValue.value = {
      title: row.title,
      category: row.category,
      status: row.status,
      content: row.content || ''
    }
  } else {
    const defaultCat = categoryFormOptions.value[0]?.value as string | undefined
    formValue.value = { title: '', category: defaultCat ?? null, status: '已发布', content: '' }
    fileList.value = []
  }
  showDocModal.value = true
}

function closeDocModal() {
  showDocModal.value = false
  editingDoc.value = null
}

async function submitDoc() {
  const errors = await new Promise<unknown>((resolve) => formRef.value?.validate(resolve))
  if (errors) return
  const payload = {
    title: formValue.value.title,
    category: formValue.value.category as string,
    author: '',
    status: formValue.value.status,
    statusType: getStatusType(formValue.value.status),
    content: formValue.value.content,
    attachment: fileList.value[0]?.name || null
  }
  if (modalMode.value === 'edit' && editingDoc.value) {
    await kbStore.updateDocument(editingDoc.value.id, payload)
    message.success('文档已更新')
  } else {
    await kbStore.createDocument(payload)
    message.success('文档已上传')
  }
  closeDocModal()
  nextTick(() => fetchFromApi())
}

// ========== 查看详情 Drawer ==========
const docDetailVisible = ref(false)
const activeDoc = ref<KbDoc | null>(null)
const docDetailLoading = ref(false)

async function viewDoc(row: KbDoc) {
  docDetailVisible.value = true
  activeDoc.value = { ...row }
  // 尝试从后端拿详情内容（含 content / summary / tags / views 等）
  docDetailLoading.value = true
  try {
    const { data } = await getKbDocumentDetail(String(row.id))
    activeDoc.value = {
      ...activeDoc.value,
      content: data.content || activeDoc.value?.content,
      category: data.category || activeDoc.value?.category,
      author: data.author?.name || activeDoc.value?.author,
      updatedAt: (data.updatedAt || data.createdAt || '').slice(0, 10)
    }
  } catch {
    // 若后端无详情接口，保留表格行数据即可
  } finally {
    docDetailLoading.value = false
  }
}

// ========== 删除确认 ==========
function confirmDelete(row: KbDoc) {
  pendingDeleteDoc.value = row
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!pendingDeleteDoc.value) return
  await kbStore.deleteDocument(pendingDeleteDoc.value.id)
  message.success('文档已删除')
  showDeleteModal.value = false
  pendingDeleteDoc.value = null
  nextTick(() => fetchFromApi())
}

// ========== 功能入口：后端暂不支持的操作给出明确提示，而不是"什么都不发生" ==========
function createCategory() {
  message.info('分类管理功能暂未开放，当前分类可由文档上传时自动创建。')
}
</script>

<template>
  <div class="kb-page">
    <!-- Toolbar -->
    <n-card class="toolbar-card">
      <n-space justify="space-between" align="center" wrap>
        <n-space wrap>
          <n-input v-model:value="searchKeyword" placeholder="搜索文档名称、作者..." style="width: 320px" clearable @keyup.enter="resetAndFetch">
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>
          <n-button quaternary @click="resetAndFetch">
            <template #icon><RefreshCw :size="16" /></template>
            刷新
          </n-button>
        </n-space>
        <n-space>
          <n-button @click="createCategory">
            <template #icon>
              <FolderPlus :size="16" />
            </template>
            新建分类
          </n-button>
          <n-button type="primary" @click="openDocModal('upload')">
            <template #icon>
              <Upload :size="16" />
            </template>
            上传文档
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- Two-column layout: fixed 260px category sidebar + flex-1 table -->
    <div class="content-wrap">
      <n-card title="文档分类" class="category-card" :bordered="false">
        <template #header-extra>
          <n-button quaternary size="small" @click="createCategory">
            <template #icon>
              <Plus :size="16" />
            </template>
          </n-button>
        </template>
        <n-tree
          block-line
          :data="categoryTreeData"
          default-expand-all
          selectable
          clearable
          @update:selected-keys="onCategorySelect"
        />
      </n-card>

      <n-card class="table-card" :bordered="false">
        <n-empty v-if="!kbStore.loading && tableData.length === 0" description="暂无文档，点击右上角「上传文档」创建" />
        <n-data-table
          v-else
          :columns="columns"
          :data="tableData"
          :bordered="false"
          :single-line="false"
          size="small"
          :loading="kbStore.loading"
          remote
        />
        <div class="pagination-bar">
          <span class="pagination-text">共 {{ total }} 条，每页 {{ pageSize }} 条</span>
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            :item-count="total"
            :page-sizes="[10, 20, 50]"
            show-size-picker
          />
        </div>
      </n-card>
    </div>

    <!-- Upload/Edit modal -->
    <n-modal v-model:show="showDocModal" :title="modalMode === 'edit' ? '编辑文档' : '上传/新增文档'" preset="card" style="width: 560px; max-width: 90vw;">
      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top">
        <n-form-item label="文档标题" path="title">
          <n-input v-model:value="formValue.title" placeholder="请输入文档标题" />
        </n-form-item>
        <n-form-item label="所属分类" path="category">
          <n-select v-model:value="formValue.category" :options="categoryFormOptions" filterable allow-create placeholder="请选择或输入分类" />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="formValue.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="文档内容">
          <n-input v-model:value="formValue.content" type="textarea" :rows="5" placeholder="请输入文档内容（可选）" />
        </n-form-item>
        <n-form-item label="上传附件（演示，不真正上传）">
          <n-upload v-model:file-list="fileList" :max="1" :show-file-list="true">
            <n-upload-dragger>
              <div style="margin-bottom: 8px">
                <n-icon size="32" :depth="3">
                  <UploadCloud />
                </n-icon>
              </div>
              <n-text style="font-size: 14px">点击选择文件（演示模式）</n-text>
            </n-upload-dragger>
          </n-upload>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="closeDocModal">取消</n-button>
          <n-button type="primary" @click="submitDoc">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Doc detail drawer -->
    <n-drawer v-model:show="docDetailVisible" :width="560" placement="right">
      <n-drawer-content v-if="activeDoc" :title="activeDoc.title" closable>
        <div class="detail-inner">
          <n-spin :show="docDetailLoading">
            <n-space vertical :size="16">
              <n-space :size="12" wrap>
                <n-tag round size="small" type="primary">{{ activeDoc.category }}</n-tag>
                <n-tag round size="small" :type="activeDoc.statusType as never">{{ activeDoc.status }}</n-tag>
              </n-space>
              <n-space align="center" :size="10">
                <n-avatar round size="small" :style="{ background: 'var(--oak-primary, #E58A2E)', color: '#fff' }">
                  {{ (activeDoc.author || '文').charAt(0) }}
                </n-avatar>
                <span style="font-size: 14px; color: #2A261F;">{{ activeDoc.author || '未知作者' }}</span>
                <span style="font-size: 12px; color: #9F968A;">更新于 {{ activeDoc.updatedAt }}</span>
              </n-space>
              <n-divider />
              <div>
                <div style="font-size: 14px; font-weight: 600; color: #2A261F; margin-bottom: 8px;">文档内容</div>
                <div class="doc-body">
                  {{ activeDoc.content || '（该文档暂未提供详情内容）' }}
                </div>
              </div>
            </n-space>
          </n-spin>
        </div>
      </n-drawer-content>
    </n-drawer>

    <!-- 删除确认弹窗 -->
    <n-modal v-model:show="showDeleteModal" preset="dialog" title="确认删除" :show-icon="false">
      <span>确定要删除《{{ pendingDeleteDoc?.title }}》吗？</span>
      <template #action>
        <n-space justify="end" :size="12">
          <n-button @click="showDeleteModal = false">取消</n-button>
          <n-button type="error" @click="executeDelete">确认删除</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.kb-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar-card {
  margin-bottom: 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.content-wrap {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: calc(100vh - 220px);
}

.category-card {
  width: 260px;
  flex-shrink: 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
}

.table-card {
  flex: 1;
  min-width: 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04), 0 4px 12px rgba(42, 38, 31, 0.04);
  display: flex;
  flex-direction: column;
}

.table-card :deep(.n-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-card :deep(.n-data-table) {
  flex: 1;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #E8E2D9;
}

.pagination-text {
  font-size: 13px;
  color: #9F968A;
}

.detail-inner {
  padding: 4px 4px 16px;
}

.doc-body {
  background: #F7F4EF;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #6E665B;
  white-space: pre-wrap;
  max-height: 50vh;
  overflow: auto;
}

@media (max-width: 768px) {
  .content-wrap {
    flex-direction: column;
  }
  .category-card {
    width: 100%;
  }
}
</style>
