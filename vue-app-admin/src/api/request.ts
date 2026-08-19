import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('oa_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    return response
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response
      if (status === 401) {
        localStorage.removeItem('oa_token')
        window.location.href = '/login'
      } else if (status === 403) {
        console.error('没有权限访问该资源')
      }
    }
    return Promise.reject(error)
  }
)

export default request
