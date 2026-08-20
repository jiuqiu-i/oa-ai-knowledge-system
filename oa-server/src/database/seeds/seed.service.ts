import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Approval, ApprovalStatus, ApprovalType, ApprovalUrgency } from '../../entities/approval.entity';
import { KnowledgeBase } from '../../entities/kb.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Approval)
    private readonly approvalRepository: Repository<Approval>,
    @InjectRepository(KnowledgeBase)
    private readonly kbRepository: Repository<KnowledgeBase>,
  ) {}

  async run() {
    this.logger.log('开始填充测试数据...');

    const admin = await this.seedAdmin();
    const users = await this.seedUsers();
    await this.seedApprovals(users);
    await this.seedKnowledgeBase(users, admin);

    this.logger.log('测试数据填充完成');
  }

  private async seedAdmin(): Promise<User> {
    const email = 'admin@oa.com';
    const rawPassword = '123456';
    let admin = await this.userRepository.findOne({ where: { email } });

    if (!admin) {
      admin = this.userRepository.create({
        name: '系统管理员',
        email,
        password: await bcrypt.hash(rawPassword, 10),
        role: UserRole.ADMIN,
        dept: '管理部',
        avatarColor: '#E58A2E',
        status: UserStatus.ACTIVE,
      });
      await this.userRepository.save(admin);
      this.logger.log(`管理员账号已创建: ${email} / ${rawPassword}`);
    } else {
      // 用户存在也强制重置密码，确保开发者每次启动都可用同一凭据登录
      admin.password = await bcrypt.hash(rawPassword, 10);
      admin.role = UserRole.ADMIN;
      admin.status = UserStatus.ACTIVE;
      admin.name = '系统管理员';
      admin.dept = '管理部';
      admin.avatarColor = '#E58A2E';
      await this.userRepository.save(admin);
      this.logger.log(`管理员账号已重置密码: ${email} / ${rawPassword}`);
    }

    return admin;
  }

  private async seedUsers(): Promise<User[]> {
    const rawPassword = '123456';
    const userData = [
      { name: '李思远', email: 'lisiyuan@oa.com', dept: '技术部', avatarColor: '#E58A2E' },
      { name: '王嘉怡', email: 'wangjiayi@oa.com', dept: '人事部', avatarColor: '#2E90FA' },
      { name: '张伟', email: 'zhangwei@oa.com', dept: '产品部', avatarColor: '#34A853' },
      { name: '陈静', email: 'chenjing@oa.com', dept: '财务部', avatarColor: '#F5B800' },
      { name: '刘洋', email: 'liuyang@oa.com', dept: '市场部', avatarColor: '#9F968A' },
      { name: '赵敏', email: 'zhaomin@oa.com', dept: '运营部', avatarColor: '#8B5CF6' },
    ];

    const users: User[] = [];
    for (const data of userData) {
      let user = await this.userRepository.findOne({ where: { email: data.email } });
      if (!user) {
        user = this.userRepository.create({
          ...data,
          password: await bcrypt.hash(rawPassword, 10),
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        });
        await this.userRepository.save(user);
      } else {
        // 存在也强制重置密码、角色、状态，保证每次启动可用一致密码
        user.name = data.name;
        user.dept = data.dept;
        user.avatarColor = data.avatarColor;
        user.password = await bcrypt.hash(rawPassword, 10);
        user.role = UserRole.USER;
        user.status = UserStatus.ACTIVE;
        await this.userRepository.save(user);
      }
      users.push(user);
    }

    this.logger.log(`已确保 ${users.length} 个普通用户存在，默认密码：${rawPassword}`);
    return users;
  }

  private async seedApprovals(users: User[]): Promise<void> {
    const approvalData = [
      { applicant: users[0], type: ApprovalType.LEAVE, title: '请假申请 - 事假 2 天', content: '因个人事务需请假 2 天，请审批。', amount: null, status: ApprovalStatus.PENDING, urgency: ApprovalUrgency.MEDIUM },
      { applicant: users[1], type: ApprovalType.EXPENSE, title: '差旅报销 - 上海出差', content: '上海出差交通及住宿费用报销。', amount: 1860, status: ApprovalStatus.PENDING, urgency: ApprovalUrgency.MEDIUM },
      { applicant: users[2], type: ApprovalType.PROCUREMENT, title: '采购申请 - 办公设备', content: '申请采购 2 台 4K 显示器。', amount: 5600, status: ApprovalStatus.PENDING, urgency: ApprovalUrgency.HIGH },
      { applicant: users[3], type: ApprovalType.BUSINESS_TRIP, title: '出差申请 - 深圳客户拜访', content: '前往深圳拜访客户，预计 3 天。', amount: null, status: ApprovalStatus.PENDING, urgency: ApprovalUrgency.HIGH },
      { applicant: users[4], type: ApprovalType.OTHER, title: '加班申请 - 项目上线', content: '本周六项目上线支持，申请加班。', amount: null, status: ApprovalStatus.PENDING, urgency: ApprovalUrgency.LOW },
      { applicant: users[0], type: ApprovalType.EXPENSE, title: '团建费用报销', content: '技术部季度团建费用报销。', amount: 3200, status: ApprovalStatus.APPROVED, urgency: ApprovalUrgency.MEDIUM },
      { applicant: users[1], type: ApprovalType.LEAVE, title: '年假申请 - 3 天', content: '申请年假 3 天。', amount: null, status: ApprovalStatus.REJECTED, urgency: ApprovalUrgency.MEDIUM },
    ];

    for (const data of approvalData) {
      const exists = await this.approvalRepository.findOne({
        where: { title: data.title, applicantId: data.applicant.id },
      });
      if (!exists) {
        const approval = this.approvalRepository.create({
          ...data,
          applicantId: data.applicant.id,
        });
        await this.approvalRepository.save(approval);
      }
    }

    this.logger.log(`已确保 ${approvalData.length} 条审批记录存在`);
  }

  private async seedKnowledgeBase(users: User[], admin: User): Promise<void> {
    const kbData = [
      {
        title: '新员工入职指南',
        category: '人事制度',
        tags: ['入职', '人事', '制度'],
        summary: '帮助新员工快速了解公司文化、规章制度和办公流程。',
        content: '## 一、入职前准备\n\n请准备好身份证、学历证明、离职证明等材料的原件和复印件。\n\n## 二、入职当天流程\n\n1. 9:00 到达前台签到\n2. 领取办公设备和门禁卡\n3. 参加入职培训\n4. 办理邮箱和系统账号\n\n## 三、常用系统\n\n- OA 办公系统\n- 知识库\n- 考勤系统\n- 报销系统',
        author: admin,
        views: 328,
      },
      {
        title: '差旅报销规范',
        category: '财务制度',
        tags: ['报销', '差旅', '财务'],
        summary: '详细说明差旅报销的标准、流程和注意事项。',
        content: '## 报销标准\n\n### 交通工具\n- 高铁：二等座\n- 飞机：经济舱\n- 市内交通：实报实销\n\n### 住宿标准\n- 一线城市：500 元/晚\n- 二线城市：350 元/晚\n- 其他城市：250 元/晚\n\n## 报销流程\n\n1. 在 OA 系统提交报销申请\n2. 上传发票照片\n3. 直属领导审批\n4. 财务审核打款',
        author: users[3],
        views: 215,
      },
      {
        title: '前端开发规范',
        category: '技术文档',
        tags: ['前端', 'Vue', 'TypeScript', '规范'],
        summary: '团队前端项目代码规范，包括命名、组件、状态管理等。',
        content: '## 技术栈\n\n- Vue 3 + TypeScript\n- Vite\n- Pinia\n- Naive UI\n- ECharts\n\n## 代码规范\n\n1. 组件使用 `<script setup lang="ts">`\n2. 接口定义统一放在 `src/types`\n3. API 请求统一封装在 `src/api`\n4. 状态管理按模块拆分',
        author: users[0],
        views: 186,
      },
      {
        title: '产品需求文档模板',
        category: '产品文档',
        tags: ['产品', 'PRD', '模板'],
        summary: '标准产品需求文档模板，包含背景、目标、功能描述等章节。',
        content: '## 1. 项目背景\n\n描述项目要解决的痛点和业务价值。\n\n## 2. 目标用户\n\n- 主要用户\n- 次要用户\n\n## 3. 功能需求\n\n### 3.1 功能一\n详细描述功能逻辑和交互。\n\n### 3.2 功能二\n\n## 4. 非功能需求\n\n- 性能\n- 安全\n- 兼容性',
        author: users[2],
        views: 142,
      },
      {
        title: '2026 年市场部 Q3 计划',
        category: '市场运营',
        tags: ['市场', 'Q3', '计划'],
        summary: '市场部第三季度工作计划和重点项目。',
        content: '## 目标\n\n- 品牌曝光量提升 30%\n- 线索数量增长 50%\n- 客户转化率提升 5%\n\n## 重点项目\n\n1. 行业白皮书发布\n2. 线上 webinar 系列\n3. 合作伙伴大会\n4. 社交媒体运营',
        author: users[4],
        views: 98,
      },
      {
        title: '客户服务 FAQ',
        category: '运营支持',
        tags: ['客服', 'FAQ', '运营'],
        summary: '客户常见问题和标准回复话术。',
        content: '## 账号问题\n\nQ: 忘记密码怎么办？\nA: 在登录页点击「忘记密码」，通过邮箱重置。\n\nQ: 账号被锁定怎么办？\nA: 联系管理员解锁或等待 30 分钟后自动解锁。\n\n## 审批问题\n\nQ: 审批被驳回了还能重新提交吗？\nA: 可以，修改后重新提交即可。',
        author: users[5],
        views: 76,
      },
    ];

    for (const data of kbData) {
      const exists = await this.kbRepository.findOne({ where: { title: data.title } });
      if (!exists) {
        const doc = this.kbRepository.create({
          ...data,
          authorId: data.author.id,
        });
        await this.kbRepository.save(doc);
      }
    }

    this.logger.log(`已确保 ${kbData.length} 篇知识库文档存在`);
  }
}
