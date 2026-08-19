import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';
import { Approval, ApprovalStatus } from '../entities/approval.entity';
import { KnowledgeBase } from '../entities/kb.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Approval)
    private approvalRepository: Repository<Approval>,
    @InjectRepository(KnowledgeBase)
    private kbRepository: Repository<KnowledgeBase>,
  ) {}

  async getStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const pendingApprovals = await this.approvalRepository.count({
      where: { status: ApprovalStatus.PENDING },
    });
    const totalDocs = await this.kbRepository.count();

    return {
      totalUsers,
      activeUsers,
      pendingApprovals,
      totalDocs,
    };
  }

  async getTrends(days = 7) {
    const result = [];
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

  async getDeptContributions() {
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

  async getOverview() {
    const [stats, trends, deptContributions] = await Promise.all([
      this.getStats(),
      this.getTrends(),
      this.getDeptContributions(),
    ]);

    return {
      ...stats,
      trends,
      deptContributions,
    };
  }

}
