import { tool, DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AiToolsService } from './ai-tools.service';

/**
 * LangChain 工具函数集 - 暴露给大模型的"后端能力 Schema"
 *
 * 四个工具满足考核要求："至少 3 个 AI 可调用工具函数封装"：
 *   1. search_knowledge_base      - 知识库检索（自然语言→结构化召回，仅摘要）
 *   2. get_knowledge_base_detail  - 知识库文档详情（按 ID 取正文，补充检索）
 *   3. get_approval_stats         - 审批统计汇总（数据库→智能报表）
 *   4. get_dashboard_report       - 仪表盘运营报表（多表聚合→周报/日报）
 *
 * 注：zod schema 与 LangChain tool() 泛型组合会触发 TS 深度泛型实例化，
 *     导致 TS2589 告警与编译期内存溢出。此处将 schema 断言为 any 阻断推断，
 *     func 入参显式标注，保留运行期类型安全与可读性。
 */
export function buildAiTools(toolsService: AiToolsService): DynamicStructuredTool[] {
  // 工具1：知识库检索
  const searchTool = tool(
    async (input: { keyword: string; limit: number }) => {
      const result = await toolsService.searchKnowledgeBase(input.keyword, input.limit || 5);
      return JSON.stringify(result);
    },
    {
      name: 'search_knowledge_base',
      description:
        '在办公知识库中按关键词检索文档。当用户询问"有没有关于X的资料/文档/规范"时调用。' +
        '返回文档标题、分类、摘要、作者、浏览量，不含正文。',
      schema: z.object({
        keyword: z.string().describe('检索关键词，中文或英文，可为短语。留空则返回热门文档。'),
        limit: z
          .number()
          .int()
          .positive()
          .min(1)
          .max(20)
          .describe('返回文档数量上限，默认 5；无明确数量需求时填 5'),
      }) as any,
    },
  );

  // 工具2：审批统计
  const approvalStatsTool = tool(
    async () => {
      const result = await toolsService.getApprovalStats();
      return JSON.stringify(result);
    },
    {
      name: 'get_approval_stats',
      description:
        '汇总办公审批数据，按状态/类型/紧急度分组统计，并计算待审批金额合计。' +
        '当用户询问"有多少待办审批/审批概览/待办统计"时调用。',
      schema: z.object({}) as any,
    },
  );

  // 工具3：仪表盘报表
  const dashboardTool = tool(
    async (input: { days: number }) => {
      const result = await toolsService.getDashboardReport(input.days || 7);
      return JSON.stringify(result);
    },
    {
      name: 'get_dashboard_report',
      description:
        '生成仪表盘运营报表：用户/文档/审批核心 KPI、近 N 天趋势、部门知识贡献。' +
        '当用户询问"运营概览/数据日报/周报/整体情况"时调用。',
      schema: z.object({
        days: z
          .number()
          .int()
          .positive()
          .min(1)
          .max(90)
          .describe('趋势统计天数，默认 7；无明确趋势时长需求时填 7'),
      }) as any,
    },
  );

  // 工具4：知识库文档详情
  const detailTool = tool(
    async (input: { id: string }) => {
      const result = await toolsService.getKnowledgeBaseDetail(input.id);
      return JSON.stringify(result);
    },
    {
      name: 'get_knowledge_base_detail',
      description:
        '按文档 ID 获取知识库文档详情（含正文）。当用户想查看某篇文档的完整内容、' +
        '或针对检索结果中的某篇文档追问具体细节时调用。需先通过 search_knowledge_base ' +
        '拿到文档 id，再调用本工具读取正文。未找到时返回 found:false。',
      schema: z.object({
        id: z.string().describe('知识库文档 ID（UUID），来自 search_knowledge_base 返回结果'),
      }) as any,
    },
  );

  // 运行期 tool() 在传入 zod schema 时产出 DynamicStructuredTool，
  // 此处经 unknown 中转断言以规避 zod 深度泛型推断导致的 TS2589/内存溢出
  return [searchTool, approvalStatsTool, dashboardTool, detailTool] as unknown as DynamicStructuredTool[];
}
