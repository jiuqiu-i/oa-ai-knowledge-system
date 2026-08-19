<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { DataTableColumns, FormInst, FormRules, TreeOption, SelectOption, UploadFileInfo } from 'naive-ui'
import {
  NGrid,
  NGridItem,
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
  useMessage,
  useDialog
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
  UploadCloud
} from 'lucide-vue-next'
import type { KbDoc, KbDocStatus, KbCategory } from '@/types'
import { useKbStore } from '@/stores'

const message = useMessage()
const dialog = useDialog()
const kbStore = useKbStore()

const searchKeyword = ref('')
const batchAction = ref<string | null>(null)
const batchOptions: SelectOption[] = [
  { label: '批量发布', value: 'publish' },
  { label: '批量归档', value: 'archive' },
  { label: '批量删除', value: 'delete' }
]

const treeData: TreeOption[] = [
  {
    label: '产品文档',
    key: 'product',
    prefix: () => h(NIcon, { color: '#E58A2E' }, { default: () => h(Folder) }),
    children: [
      { label: '需求文档', key: 'product-requirement' },
      { label: '用户手册', key: 'product-manual' }
    ]
  },
  {
    label: '研发规范',
    key: 'dev',
    prefix: () => h(NIcon, { color: '#E58A2E' }, { default: () => h(Folder) }),
    children: [
      { label: '前端规范', key: 'dev-frontend' },
      { label: 'API 文档', key: 'dev-api' }
    ]
  },
  { label: '销售手册', key: 'sales', prefix: () => h(NIcon, { color: '#E58A2E' }, { default: () => h(Folder) }) },
  { label: '人事制度', key: 'hr', prefix: () => h(NIcon, { color: '#E58A2E' }, { default: () => h(Folder) }) },
  { label: '培训资料', key: 'training', prefix: () => h(NIcon, { color: '#E58A2E' }, { default: () => h(Folder) }) },
  { label: '未分类', key: 'uncategorized', prefix: () => h(NIcon, { color: '#9F968A' }, { default: () => h(FolderX) }) }
]

const categoryOptions: SelectOption[] = [
  { label: '产品文档 / 需求文档', value: '产品文档 / 需求文档' },
  { label: '产品文档 / 用户手册', value: '产品文档 / 用户手册' },
  { label: '研发规范 / 前端规范', value: '研发规范 / 前端规范' },
  { label: '研发规范 / API 文档', value: '研发规范 / API 文档' },
  { label: '销售手册', value: '销售手册' },
  { label: '人事制度', value: '人事制度' },
  { label: '培训资料', value: '培训资料' },
  { label: '未分类', value: '未分类' }
]

const statusOptions: SelectOption[] = [
  { label: '已发布', value: '已发布' },
  { label: '草稿', value: '草稿' },
  { label: '已归档', value: '已归档' }
]

const initialDocs: KbDoc[] = [
  { id: 1, title: 'Oak OA 产品白皮书 v2.0', category: '产品文档 / 需求文档', author: '林晓', updatedAt: '2026-08-15', status: '已发布', statusType: 'success' },
  { id: 2, title: '销售话术与竞品对比 Q3', category: '销售手册', author: '王磊', updatedAt: '2026-08-14', status: '草稿', statusType: 'warning' },
  { id: 3, title: '前端代码规范 v3.1', category: '研发规范 / 前端规范', author: '陈晨', updatedAt: '2026-08-12', status: '已发布', statusType: 'success' },
  { id: 4, title: '新员工入职指南', category: '人事制度', author: '赵敏', updatedAt: '2026-08-10', status: '已归档', statusType: 'default' },
  { id: 5, title: 'AI 接入配置说明', category: '产品文档 / 用户手册', author: '刘洋', updatedAt: '2026-08-09', status: '已发布', statusType: 'success' },
  { id: 6, title: '培训资料：高效会议管理', category: '培训资料', author: '孙婷', updatedAt: '2026-08-08', status: '草稿', statusType: 'warning' }
]
kbStore.setDocuments(initialDocs)
kbStore.setCategories(treeData as unknown as KbCategory[])

const filteredDocuments = computed(() => {
  if (!searchKeyword.value) return kbStore.documents
  const keyword = searchKeyword.value.toLowerCase()
  return kbStore.documents.filter(doc =>
    doc.title.toLowerCase().includes(keyword) ||
    doc.author.toLowerCase().includes(keyword)
  )
})

const columns: DataTableColumns<KbDoc> = [
  {
    type: 'selection'
  },
  { title: '文档名称', key: 'title' },
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

const showDocModal = ref(false)
const modalMode = ref<'upload' | 'edit'>('upload')
const editingDoc = ref<KbDoc | null>(null)
const formRef = ref<FormInst | null>(null)
const formValue = ref({
  title: '',
  category: null as string | null,
  author: '',
  status: '已发布' as KbDocStatus,
  content: ''
})
const fileList = ref<UploadFileInfo[]>([])

const rules: FormRules = {
  title: { required: true, message: '请输入文档标题', trigger: 'blur' },
  category: { required: true, message: '请选择分类', trigger: 'change' },
  author: { required: true, message: '请输入作者', trigger: 'blur' },
  status: { required: true, message: '请选择状态', trigger: 'change' }
}

function getStatusType(status: KbDocStatus): KbDoc['statusType'] {
  return status === '已发布' ? 'success' : status === '草稿' ? 'warning' : 'default'
}

function openDocModal(mode: 'upload' | 'edit', row: KbDoc | null = null) {
  modalMode.value = mode
  editingDoc.value = row
  if (mode === 'edit' && row) {
    formValue.value = {
      title: row.title,
      category: row.category,
      author: row.author,
      status: row.status,
      content: row.content || ''
    }
  } else {
    formValue.value = { title: '', category: null, author: '', status: '已发布', content: '' }
    fileList.value = []
  }
  showDocModal.value = true
}

function closeDocModal() {
  showDocModal.value = false
  editingDoc.value = null
}

function submitDoc() {
  formRef.value?.validate((errors) => {
    if (errors) return
    const payload: Omit<KbDoc, 'id' | 'updatedAt'> = {
      title: formValue.value.title,
      category: formValue.value.category as string,
      author: formValue.value.author,
      status: formValue.value.status,
      statusType: getStatusType(formValue.value.status),
      content: formValue.value.content,
      attachment: fileList.value[0]?.name || null
    }
    if (modalMode.value === 'edit' && editingDoc.value) {
      kbStore.updateDocument(editingDoc.value.id, payload)
      message.success('文档已更新')
    } else {
      kbStore.createDocument(payload)
      message.success('文档已上传')
    }
    closeDocModal()
  })
}

function viewDoc(row: KbDoc) {
  message.info(`查看文档：${row.title}`)
}

function confirmDelete(row: KbDoc) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除《${row.title}》吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => {
      kbStore.deleteDocument(row.id)
      message.success('文档已删除')
    }
  })
}

function createCategory() {
  message.info('新建分类功能演示')
}

function handleBatchAction(value: string) {
  message.info(`批量操作：${batchOptions.find(o => o.value === value)?.label}`)
  batchAction.value = null
}
</script>

<template>
  <div class="kb-page">
    <!-- Toolbar -->
    <n-card class="toolbar-card">
      <n-space justify="space-between" align="center" wrap>
        <n-input v-model:value="searchKeyword" placeholder="搜索文档名称、作者..." style="width: 320px">
          <template #prefix>
            <Search :size="16" />
          </template>
        </n-input>
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
          <n-select v-model:value="batchAction" :options="batchOptions" placeholder="批量操作" style="width: 140px" clearable @update:value="handleBatchAction" />
        </n-space>
      </n-space>
    </n-card>

    <!-- Two-column layout -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" class="content-grid">
      <n-grid-item span="4 s:1">
        <n-card title="文档分类" class="category-card">
          <template #header-extra>
            <n-button quaternary size="small" @click="createCategory">
              <template #icon>
                <Plus :size="16" />
              </template>
            </n-button>
          </template>
          <n-tree
            block-line
            :data="treeData"
            default-expand-all
            selectable
          />
        </n-card>
      </n-grid-item>

      <n-grid-item span="4 s:3">
        <n-card class="table-card">
          <n-data-table
            :columns="columns"
            :data="filteredDocuments"
            :bordered="false"
            :single-line="false"
            size="small"
          />
          <div class="pagination-bar">
            <span class="pagination-text">共 124 条，每页 10 条</span>
            <n-pagination :page="1" :page-size="10" :item-count="124" />
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- Upload/Edit modal -->
    <n-modal v-model:show="showDocModal" :title="modalMode === 'edit' ? '编辑文档' : '上传/新增文档'" preset="card" style="width: 560px">
      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top">
        <n-form-item label="文档标题" path="title">
          <n-input v-model:value="formValue.title" placeholder="请输入文档标题" />
        </n-form-item>
        <n-form-item label="所属分类" path="category">
          <n-select v-model:value="formValue.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="作者" path="author">
          <n-input v-model:value="formValue.author" placeholder="请输入作者" />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="formValue.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="文档内容">
          <n-input v-model:value="formValue.content" type="textarea" :rows="5" placeholder="请输入文档内容" />
        </n-form-item>
        <n-form-item label="上传附件">
          <n-upload v-model:file-list="fileList" :max="1">
            <n-upload-dragger>
              <div style="margin-bottom: 8px">
                <n-icon size="32" :depth="3">
                  <UploadCloud />
                </n-icon>
              </div>
              <n-text style="font-size: 14px">点击选择文件（演示）</n-text>
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
  </div>
</template>

<style scoped>
.kb-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.toolbar-card {
  margin-bottom: 0;
}

.content-grid {
  margin-top: 0;
}

.category-card {
  min-height: calc(100vh - 220px);
}

.table-card {
  min-height: calc(100vh - 220px);
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
</style>
