import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Approval, ApprovalStatus } from '../entities/approval.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { QueryApprovalDto } from './dto/query-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private approvalRepository: Repository<Approval>,
  ) {}

  async create(userId: string, dto: CreateApprovalDto) {
    const approval = this.approvalRepository.create({
      ...dto,
      applicantId: userId,
      status: ApprovalStatus.PENDING,
    });
    return this.approvalRepository.save(approval);
  }

  async findAll(query: QueryApprovalDto) {
    const { keyword, type, status, page = 1, pageSize = 10 } = query;
    const where: any = {};
    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.approvalRepository.findAndCount({
      where,
      relations: ['applicant'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async findMyApprovals(userId: string, query: QueryApprovalDto) {
    const { keyword, type, status, page = 1, pageSize = 10 } = query;
    const where: any = { applicantId: userId };
    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.approvalRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async findPendingStats(user: User) {
    let where: any = { status: ApprovalStatus.PENDING };
    if (user.role !== UserRole.ADMIN) {
      where = { ...where, applicantId: user.id };
    }
    const count = await this.approvalRepository.count({ where });
    return { pendingCount: count };
  }

  async findOne(id: string) {
    const approval = await this.approvalRepository.findOne({
      where: { id },
      relations: ['applicant'],
    });
    if (!approval) {
      throw new NotFoundException('审批记录不存在');
    }
    return approval;
  }

  async update(id: string, userId: string, dto: UpdateApprovalDto) {
    const approval = await this.findOne(id);
    if (approval.applicantId !== userId) {
      throw new ForbiddenException('只能修改自己的申请');
    }
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ForbiddenException('已审批的记录不能修改');
    }
    await this.approvalRepository.update(id, dto);
    return this.findOne(id);
  }

  async review(id: string, user: User, dto: ReviewApprovalDto) {
    const approval = await this.findOne(id);
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ForbiddenException('该记录已审批');
    }
    await this.approvalRepository.update(id, {
      status: dto.status,
      remark: dto.remark,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    const approval = await this.findOne(id);
    await this.approvalRepository.remove(approval);
    return { id };
  }
}
