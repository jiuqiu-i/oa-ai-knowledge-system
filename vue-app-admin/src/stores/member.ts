import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, UserPayload } from '@/types'
import {
  createUser,
  updateUser,
  deleteUser,
  disableUser,
  getUserList,
  getDepartments
} from '@/api/user'
import type { ApiUser, ApiUserStatus, ApiUserRole, UserQueryParams } from '@/types'

/**
 * 视图模型 <-> 后端实体映射
 * 视图模型 User 使用 department / joinedAt / role(admin|member|visitor) / status(active|inactive|pending)
 * 后端 ApiUser 使用 dept / createdAt / role(admin|user) / status(active|disabled)
 */

const mapRoleToApi = (r: UserPayload['role']): ApiUserRole =>
  r === 'admin' ? 'admin' : 'user'

const mapStatusToApi = (s: UserPayload['status']): ApiUserStatus =>
  s === 'active' ? 'active' : 'disabled'

const mapApiToView = (u: ApiUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  department: u.dept,
  role: u.role === 'admin' ? 'admin' : 'member',
  status: u.status === 'active' ? 'active' : 'inactive',
  joinedAt: (u.createdAt || '').slice(0, 10),
  avatar: u.avatarColor
})

export const useMemberStore = defineStore('member', () => {
  const members = ref<User[]>([])
  const departments = ref<string[]>([])
  const loading = ref(false)
  const total = ref(0)

  const setMembers = (data: User[]) => {
    members.value = data
  }

  /** 从后端拉取成员列表 */
  const fetchMembers = async (params?: UserQueryParams) => {
    loading.value = true
    try {
      const { data } = await getUserList(params)
      members.value = data.list.map(mapApiToView)
      total.value = data.total
    } catch {
      // 接口异常时保留现有列表（演示模式）
    } finally {
      loading.value = false
    }
  }

  /** 拉取部门列表 */
  const fetchDepartments = async () => {
    try {
      const { data } = await getDepartments()
      departments.value = data
    } catch {
      departments.value = []
    }
  }

  const createMember = async (payload: UserPayload) => {
    let created: User | null = null
    try {
      const { data } = await createUser({
        name: payload.name,
        email: payload.email,
        // 管理端表单暂未采集密码，使用默认初始密码，用户首次登录后应修改
        password: '123456',
        role: mapRoleToApi(payload.role),
        dept: payload.department,
        status: mapStatusToApi(payload.status),
      })
      created = mapApiToView(data)
      members.value.unshift(created)
    } catch {
      // 回退演示模式：本地占位
      created = {
        id: Date.now(),
        joinedAt: new Date().toISOString().slice(0, 10),
        ...payload
      }
      members.value.unshift(created)
    }
    return created
  }

  const updateMember = async (id: number | string, payload: UserPayload) => {
    try {
      const { data } = await updateUser(String(id), {
        name: payload.name,
        email: payload.email,
        role: mapRoleToApi(payload.role),
        dept: payload.department,
        status: mapStatusToApi(payload.status),
      })
      const updated = mapApiToView(data)
      const index = members.value.findIndex((m) => String(m.id) === String(id))
      if (index !== -1) members.value[index] = updated
    } catch {
      const index = members.value.findIndex((m) => String(m.id) === String(id))
      if (index !== -1) {
        members.value[index] = { ...members.value[index], ...payload }
      }
    }
  }

  const deleteMember = async (id: number | string) => {
    try {
      await deleteUser(String(id))
    } catch {
      // 演示模式忽略
    }
    members.value = members.value.filter((m) => String(m.id) !== String(id))
  }

  const disableMember = async (id: number | string) => {
    const index = members.value.findIndex((m) => String(m.id) === String(id))
    if (index === -1) return
    try {
      const { data } = await disableUser(String(id))
      members.value[index] = mapApiToView(data)
    } catch {
      members.value[index].status = 'inactive'
    }
  }

  return {
    members,
    departments,
    loading,
    total,
    setMembers,
    fetchMembers,
    fetchDepartments,
    createMember,
    updateMember,
    deleteMember,
    disableMember
  }
})
