<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
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
  useMessage,
  useDialog
} from 'naive-ui'
import {
  Search,
  UserPlus,
  Pencil,
  Ban,
  Trash2
} from 'lucide-vue-next'
import type { User, UserRole, UserStatus } from '@/types'
import { useMemberStore } from '@/stores'

const message = useMessage()
const dialog = useDialog()
const memberStore = useMemberStore()

const searchKeyword = ref('')
const statusFilter = ref('')
const roleFilter = ref('')

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '在职', value: 'active' },
  { label: '离职', value: 'inactive' },
  { label: '待激活', value: 'pending' }
]

const roleOptions: SelectOption[] = [
  { label: '全部角色', value: '' },
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

const initialMembers: User[] = [
  { id: 1, name: '林晓', email: 'linxiao@oakoa.com', department: '产品部', role: 'admin', status: 'active', joinedAt: '2024-03-12' },
  { id: 2, name: '王磊', email: 'wanglei@oakoa.com', department: '销售部', role: 'member', status: 'active', joinedAt: '2024-06-08' },
  { id: 3, name: '陈晨', email: 'chenchen@oakoa.com', department: '研发部', role: 'member', status: 'pending', joinedAt: '2026-08-18' },
  { id: 4, name: '赵敏', email: 'zhaomin@oakoa.com', department: '人事部', role: 'admin', status: 'active', joinedAt: '2023-11-20' },
  { id: 5, name: '刘洋', email: 'liuyang@oakoa.com', department: '研发部', role: 'visitor', status: 'inactive', joinedAt: '2024-01-15' },
  { id: 6, name: '孙婷', email: 'sunting@oakoa.com', department: '市场部', role: 'member', status: 'active', joinedAt: '2025-02-28' },
  { id: 7, name: '周杰', email: 'zhoujie@oakoa.com', department: '财务部', role: 'visitor', status: 'pending', joinedAt: '2026-08-10' }
]
memberStore.setMembers(initialMembers)

// 后端可达时用真实数据覆盖演示数据
onMounted(() => {
  memberStore.fetchMembers()
  memberStore.fetchDepartments()
})

const filteredMembers = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return memberStore.members.filter(member => {
    const matchKeyword = !keyword || member.name.toLowerCase().includes(keyword) || member.email.toLowerCase().includes(keyword)
    const matchStatus = !statusFilter.value || member.status === statusFilter.value
    const matchRole = !roleFilter.value || member.role === roleFilter.value
    return matchKeyword && matchStatus && matchRole
  })
})

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
          h(NButton, { size: 'small', quaternary: true, onClick: () => disableMember(row) }, { icon: () => h(Ban, { size: 16 }) }),
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
  department: { required: true, message: '请输入部门', trigger: 'blur' },
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
    formValue.value = { name: '', email: '', department: '', role: 'member', status: 'active' }
    editingMember.value = null
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingMember.value = null
}

function submitMember() {
  formRef.value?.validate((errors) => {
    if (errors) return
    if (modalMode.value === 'edit' && editingMember.value) {
      memberStore.updateMember(editingMember.value.id, formValue.value)
      message.success('成员信息已更新')
    } else {
      memberStore.createMember(formValue.value)
      message.success('成员已添加')
    }
    closeModal()
  })
}

function disableMember(row: User) {
  memberStore.disableMember(row.id)
  message.warning(`已禁用成员：${row.name}`)
}

function confirmDelete(row: User) {
  dialog.warning({
    title: '确认删除',
    content: '删除后无法恢复，确定要移除该成员吗？',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => {
      memberStore.deleteMember(row.id)
      message.success(`已删除成员：${row.name}`)
    }
  })
}
</script>

<template>
  <div class="members-page">
    <!-- Toolbar -->
    <n-card class="toolbar-card">
      <n-space justify="space-between" align="center" wrap>
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="按姓名/邮箱搜索..." style="width: 260px">
            <template #prefix>
              <Search :size="16" />
            </template>
          </n-input>
          <n-select v-model:value="statusFilter" :options="statusOptions" style="width: 140px" />
          <n-select v-model:value="roleFilter" :options="roleOptions" style="width: 140px" />
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
        :data="filteredMembers"
        :bordered="false"
        :single-line="false"
        size="small"
      />
      <div class="pagination-bar">
        <span class="pagination-text">共 {{ filteredMembers.length }} 条，每页 10 条</span>
        <n-pagination :page="1" :page-size="10" :item-count="filteredMembers.length" />
      </div>
    </n-card>

    <!-- Member modal -->
    <n-modal v-model:show="showModal" :title="modalMode === 'edit' ? '编辑成员' : '添加成员'" preset="card" style="width: 420px">
      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="top">
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="formValue.name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="formValue.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="部门" path="department">
          <n-input v-model:value="formValue.department" placeholder="请输入部门" />
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
