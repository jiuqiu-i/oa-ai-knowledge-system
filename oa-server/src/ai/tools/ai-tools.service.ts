import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import { Approval, ApprovalStatus, ApprovalType } from '../../entities/approval.entity';
import { KnowledgeBase } from '../../entities/kb.entity';

/**
 * AI 工具服务 - 提供给大模型调用的"业务能力"
 *
 * 设计原则：
 * 1) 工具函数封装的是后端语言（Node/NestJS）特有的数据访问与编排能力，
 *    大模型通过 Tool Schema 调用这些方法，完成"意图→数据→回复"的闭环。
 * 2) 所有方法均为纯读操作，不产生副作用，便于 Agent 安全多次调用。
 * 3) 返回结构化 JSON，便于大模型二次组织为自然语言报表。
 *
 * 对应考核：第三阶段"至少 3 个 AI 可调用工具函数"
 */
@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Approval)
    private approvalRepository: Repository<Approval>,
    @InjectRepository(KnowledgeBase)
    private kbRepository: Repository<KnowledgeBase>,
  ) {}

  /**
   * 工具1：知识库检索
   * 按关键词在 title/content 全文检索，返回摘要（不含正文，控制 token）。
   * 大模型可用此工具回答"请问关于 X 的知识库文档有哪些"类问题。
   */
  async searchKnowledgeBase(keyword: string, limit = 5) {
    this.logger.log(`[tool] searchKnowledgeBase: keyword="${keyword}", limit=${limit}`);
    const escaped = (keyword || '').replace(/["+\-<>*()~]/g, ' ').trim();
    const qb = this.kbRepository
      .createQueryBuilder('kb')
      .leftJoin('kb.author', 'author')
      .select([
        'kb.id AS id',
        'kb.title AS title',
        'kb.category AS category',
        'kb.summary AS summary',
        'kb.views AS views',
        'author.name AS author',
        'kb.createdAt AS createdAt',
      ])
      .take(limit);

    if (escaped) {
      // 优先 FULLTEXT，执行失败降级 LIKE
      try {
        const boolExpr = escaped
          .split(/\s+/)
          .filter(Boolean)
          .map((t) => `+${t}`)
          .join(' ');
        qb.where('MATCH(kb.title, kb.content) AGAINST (:boolExpr IN BOOLEAN MODE)', { boolExpr });
        const rows = await qb.getRawMany();
        return { keyword, total: rows.length, docs: rows };
      } catch (e) {
        this.logger.warn(`FULLTEXT 降级 LIKE: ${(e as Error).message}`);
      }
      qb.where('(kb.title LIKE :kw OR kb.content LIKE :kw)', { kw: `%${keyword}%` });
    } else {
      qb.orderBy('kb.views', 'DESC');
    }

    const rows = await qb.getRawMany();
    return { keyword, total: rows.length, docs: rows };
  }

  /**
   * 工具4：知识库文档详情
   * 按文档 ID 查询完整内容（含正文），供大模型在检索后深入回答文档具体内容类问题。
   * 与 searchKnowledgeBase 互补：检索仅返回摘要，详情返回正文。
   * 未找到时返回 { found: false } 而非抛错，便于大模型自行组织"未找到"回复。
   */
  async getKnowledgeBaseDetail(id: string) {
    this.logger.log(`[tool] getKnowledgeBaseDetail: id="${id}"`);
    const doc = await this.kbRepository
      .createQueryBuilder('kb')
      .leftJoin('kb.author', 'author')
      .select([
        'kb.id AS id',
        'kb.title AS title',
        'kb.category AS category',
        'kb.tags AS tags',
        'kb.summary AS summary',
        'kb.content AS content',
        'kb.views AS views',
        'kb.attachment AS attachment',
        'author.name AS author',
        'author.dept AS authorDept',
        'kb.createdAt AS createdAt',
        'kb.updatedAt AS updatedAt',
      ])
      .where('kb.id = :id', { id })
      .getRawOne();

    if (!doc) {
      return { found: false, id };
    }
    return { found: true, doc };
  }

  /**
   * 工具2：审批统计
   * 汇总各状态、各类型、各紧急度的审批数量，大模型可据此生成"我的待办概览"。
   */
  async getApprovalStats() {
    this.logger.log('[tool] getApprovalStats');

    const [byStatus, byType, byUrgency, total, pendingAmount] = await Promise.all([
      this.groupCount('status'),
      this.groupCount('type'),
      this.groupCount('urgency'),
      this.approvalRepository.count(),
      this.sumPendingAmount(),
    ]);

    return {
      total,
      byStatus,
      byType,
      byUrgency,
      pendingAmountTotal: pendingAmount,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 工具3：仪表盘智能报表
   * 汇总核心 KPI + 近 N 天趋势 + 部门知识贡献，大模型可据此生成运营日报/周报。
   */
  async getDashboardReport(days = 7) {
    this.logger.log(`[tool] getDashboardReport: days=${days}`);

    const [totalUsers, activeUsers, totalDocs, pendingApprovals, trends, deptContributions] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
        this.kbRepository.count(),
        this.approvalRepository.count({ where: { status: ApprovalStatus.PENDING } }),
        this.buildTrends(days),
        this.buildDeptContributions(),
      ]);

    return {
      kpi: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalDocs,
        pendingApprovals,
      },
      trends: { days, series: trends },
      deptContributions,
      generatedAt: new Date().toISOString(),
    };
  }

  // ---------- 内部辅助 ----------

  private async groupCount(field: 'status' | 'type' | 'urgency') {
    const rows = await this.approvalRepository
      .createQueryBuilder('a')
      .select(`a.${field}`, 'key')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy(`a.${field}`)
      .getRawMany();
    return rows.map((r) => ({ key: r.key, count: parseInt(r.count, 10) }));
  }

  private async sumPendingAmount() {
    const row = await this.approvalRepository
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.amount), 0)', 'total')
      .where('a.status = :status', { status: ApprovalStatus.PENDING })
      .getRawOne();
    return parseFloat(row?.total || '0');
  }

  private async buildTrends(days: number) {
    const result: Array<{ date: string; newUsers: number; newApprovals: number; newDocs: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const [newUsers, newApprovals, newDocs] = await Promise.all([
        this.userRepository.count({ where: { createdAt: Between(start, end) } }),
        this.approvalRepository.count({ where: { createdAt: Between(start, end) } }),
        this.kbRepository.count({ where: { createdAt: Between(start, end) } }),
      ]);
      result.push({
        date: start.toISOString().split('T')[0],
        newUsers,
        newApprovals,
        newDocs,
      });
    }
    return result;
  }

  private async buildDeptContributions() {
    const rows = await this.kbRepository
      .createQueryBuilder('kb')
      .leftJoin('kb.author', 'user')
      .select('user.dept', 'dept')
      .addSelect('COUNT(kb.id)', 'count')
      .where("user.dept <> ''")
      .groupBy('user.dept')
      .getRawMany();
    return rows.map((r) => ({ dept: r.dept, count: parseInt(r.count, 10) }));
  }
}
