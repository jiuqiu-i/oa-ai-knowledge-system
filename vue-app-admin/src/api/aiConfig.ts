import request from './request'
import type { AiConfig } from '@/types'

/** 获取 AI 配置 */
export const getAiConfig = () => {
  return request.get<AiConfig>('/ai-config')
}

/** 保存 AI 配置 */
export const saveAiConfig = (payload: AiConfig) => {
  return request.put<AiConfig>('/ai-config', payload)
}
