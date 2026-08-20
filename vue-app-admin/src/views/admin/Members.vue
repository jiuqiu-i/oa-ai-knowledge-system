<script setup lang="ts">
import { ref, computed, h, onMounted, watch } from 'vue'
import type { DataTableColumns, FormInst, FormRules, SelectOption } from 'naive-ui'
import {
  NCard,
  NInput,
  NSelect,
  NButton,
  NDataTable,
  NTag,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NPagination,
  NGrid,
  NGridItem,
  useMessage,
  useDialog
} from 'naive-ui'
import {
  Search,
  UserPlus,
  Pencil,
  Ban,
  Trash2,
  RefreshCw
} from 'lucide-vue-next'
import type { User, UserRole, UserStatus } from '@/types'
import { useMemberStore } from '@/stores'

const message = useMessage()
const dialog = useDialog()
const memberStore = useMemberStore()

const searchKeyword = ref('')
const statusFilter = ref<string | null>(null)
const roleFilter = ref<string | null>(null)
const deptFilter = ref<string | null>(null)
const page = ref<number>(1)
const pageSize = ref<number>(10)

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: undefined as unknown as string },
  { label: '在职', value: 'active' },
  { label: '离职', value: 'inactive' },
  { label: '待激活', value: 'pending' }
]

const roleOptions: SelectOption[] = [
  { label: '全部角色', value: undefined as unknown as string },
  { label: '管理员', value: 'admin' },
  { label: '普通成员', value: 'member' },
  { label: '访客', value: 'visitor' }
]

const roleMap: Record<UserRole, string> = {
  admin: '管理员',
  member: '普通成员',
  visitor: '访客'
}

const statusMap: Record<UserStatus, { label: string; type: string }> = {
  active: { label: '在职', type: 'success' },
  inactive: { label: '离职', type: 'default' },
  pending: { label: '待激活', type: 'warning' }
}

// 进入页面：拉取真实成员列表 + 部门数据（不可用则保留演示兜底）
onMounted(() => {
  fetchMembersFromApi()
  memberStore.fetchDepartments()
})

// 搜索/筛选/分页变化 -> 调后端
watch([searchKeyword, statusFilter, roleFilter, deptFilter, page, pageSize], () => {
  fetchMembersFromApi()
})

function fetchMembersFromApi() {
  const params: Record<string, unknown> = {
    page: page.value,
    pageSize: pageSize.value
  }
  if (searchKeyword.value.trim()) params.keyword = searchKeyword.value.trim()
  if (statusFilter.value) params.status = statusFilter.value === 'inactive' ? 'disabled' : statusFilter.value
  if (deptFilter.value) params.dept = deptFilter.value
  // 管理端的 role 视图选项（admin/member/visitor）映射到后端 role(admin|user)：visitor 在当前视图下与 member 等效
  if (roleFilter.value) params.role = roleFilter.value === 'admin' ? 'admin' : 'user'
  memberStore.fetchMembers(params)
}

function resetAndFetch() {
  page.value = 1
  fetchMembersFromApi()
}

// 部门筛选选项（来源于后端 departments）
const deptOptions = computed<SelectOption[]>(() => {
  const fromStore = (memberStore.departments || []).map((d) => ({ label: d, value: d }))
  return [{ label: '全部部门', value: undefined as unknown as string }, ...fromStore]
})

// 部门表单选项（用于新增/编辑成员）
const deptFormOptions = computed<SelectOption[]>(() => {
  const fromStore = (memberStore.departments || []).map((d) => ({ label: d, value: d }))
  return fromStore
})

const pageMembers = computed<User[]>(() => memberStore.members)
const total = computed<number>(() => memberStore.total || memberStore.members.length)

const columns: DataTableColumns<User> = [
  { title: '姓名', key: 'name' },
  { title: '邮箱', key: 'email' },
  { title: '部门', key: 'department' },
  { title: '角色', key: 'role', render: row => roleMap[row.role] },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const meta = statusMap[row.status]
      return h(NTag, { type: meta.type as never, size: 'small', round: true }, { default: () => meta.label })
    }
  },
  { title: '加入时间', key: 'joinedAt' },
  {
    title: '操作',
    key: 'actions',
    align: 'right',
    render(row) {
      return h(NSpace, { size: 4, justify: 'end' }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, onClick: () => openMemberModal('edit', row) }, { icon: () => h(Pencil, { size: 16 }) }),
          h(NButton, {
            size: 'small',
            quaternary: true,
            onClick: () => toggleStatus(row),
            title: row.status === 'active' ? '禁用' : '启用'
          }, { icon: () => h(Ban, { size: 16 }) }),
          h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => confirmDelete(row) }, { icon: () => h(Trash2, { size: 16 }) })
        ]
      })
    }
  }
]

const showModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  email: '',
  department: '',
  role: 'member' as UserRole,
  status: 'active' as UserStatus
})
const editingMember = ref<User | null>(null)

const rules: FormRules = {
  name: { required: true, message: '请输入姓名', trigger: 'blur' },
  email: { required: true, message: '请输入邮箱', trigger: 'blur' },
  department: { required: true, message: '请选择/输入部门', trigger: ['change', 'blur'] },
  role: { required: true, message: '请选择角色', trigger: 'change' },
  status: { required: true, message: '请选择状态', trigger: 'change' }
}

const roleFormOptions: SelectOption[] = [
  { label: '管理员', value: 'admin' },
  { label: '普通成员', value: 'member' },
  { label: '访客', value: 'visitor' }
]

const statusFormOptions: SelectOption[] = [
  { label: '在职', value: 'active' },
  { label: '离职', value: 'inactive' },
  { label: '待激活', value: 'pending' }
]

function openMemberModal(mode: 'add' | 'edit', row: User | null = null) {
  modalMode.value = mode
  if (mode === 'edit' && row) {
    formValue.value = {
      name: row.name,
      email: row.email,
      department: row.department,
      role: row.role,
      status: row.status
    }
    editingMember.value = row
  } else {
    const defaultDept = deptFormOptions.value[0]?.value as string | undefined
    formValue.value = { name: '', email: '', department: defaultDept ?? '', role: 'member', status: 'active' }
    editingMember.value = null
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingMember.value = null
}

async function submitMember() {
  const errors = await new Promise<unknown>((resolve) => formRef.value?.validate(resolve))
  if (errors) return
  if (modalMode.value === 'edit' && editingMember.value) {
    await memberStore.updateMember(editingMember.value.id, formValue.value)
    message.success('成员信息已更新')
  } else {
    await memberStore.createMember(formValue.value)
    message.success('成员已添加')
  }
  closeModal()
  resetAndFetch()
}

function toggleStatus(row: User) {
  if (row.status === 'active') {
    memberStore.disableMember(row.id)
    message.warning(`已禁用：${row.name}`)
  } else {
    // 启用：走 store 的 enable -> 调用 enableUser 接口
    import('@/api/user').then(({ enableUser }) => {
      enableUser(String(row.id)).then(({ data }) => {
        const idx = memberStore.members.findIndex((m) => String(m.id) === String(row.id))
        if (idx !== -1) {
          memberStore.members[idx] = {
            ...memberStore.members[idx],
            status: data.status === 'active' ? 'active' : 'inactive'
          }
        }
        message.success(`已启用：${row.name}`)
      }).catch(() => {
        const idx = memberStore.members.findIndex((m) => String(m.id) === String(row.id))
        if (idx !== -1) memberStore.members[idx] = { ...memberStore.members[idx], status: 'active' }
        message.success(`已启用：${row.name}`)
      })
    })
  }
}

function confirmDelete(row: User) {
  dialog.warning({
    title: '确认删除',
    content: '删除后无法恢复，确定要移除该成员吗？',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await memberStore.deleteMember(row.id)
      message.success(`已删除成员：${row.name}`)
      resetAndFetch()
    }
  })
}
</script>

<template>
  <div class="members-page">
    <!-- Toolbar -->
    <n-card class="toolbar-card">
      <n-space justify="space-between" align="center" wrap>
        <n-space wrap>
          <n-input v-model:value="searchKeyword" placeholder="按姓名/邮箱搜索..." style="width: 260px" clearable @keyup.enter="resetAndFetch">
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>
          <n-select v-model:value="deptFilter" :options="deptOptions" style="width: 160px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" style="width: 140px" />
          <n-select v-model:value="roleFilter" :options="roleOptions" style="width: 140px" />
          <n-button quaternary @click="resetAndFetch">
            <template #icon><RefreshCw :size="16" /></template>
            刷新
          </n-button>
        </n-space>
        <n-button type="primary" @click="openMemberModal('add')">
          <template #icon>
            <UserPlus :size="16" />
          </template>
          添加成员
        </n-button>
      </n-space>
    </n-card>

    <!-- Members table -->
    <n-card class="table-card">
      <n-data-table
        :columns="columns"
        :data="pageMembers"
        :bordered="false"
        :single-line="false"
        size="small"
        :loading="memberStore.loading"
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

    <!-- Member modal -->
    <n-modal v-model:show="showModal" :title="modalMode === 'edit' ? '编辑成员' : '添加成员'" preset="card" style="width: 460px; max-width: 90vw;">
      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top">
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="formValue.name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="formValue.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="部门" path="department">
          <n-select
            v-model:value="formValue.department"
            :options="deptFormOptions"
            filterable
            tag
            allow-create
            placeholder="选择或输入部门"
          />
        </n-form-item>
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item>
            <n-form-item label="角色" path="role">
              <n-select v-model:value="formValue.role" :options="roleFormOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="状态" path="status">
              <n-select v-model:value="formValue.status" :options="statusFormOptions" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="closeModal">取消</n-button>
          <n-button type="primary" @click="submitMember">提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.members-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.toolbar-card {
  margin-bottom: 0;
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
