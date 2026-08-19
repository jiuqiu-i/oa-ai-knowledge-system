import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.userRepository.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('该邮箱已被注册');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async findAll(query: QueryUserDto) {
    const { keyword, dept, status, page = 1, pageSize = 10 } = query;
    const where: any = {};

    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    if (dept) {
      where.dept = dept;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: ['id', 'name', 'email', 'role', 'dept', 'avatarColor', 'status', 'createdAt', 'updatedAt'],
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'dept', 'avatarColor', 'status', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepository.findOne({ where: { email: dto.email } });
      if (exists) {
        throw new ConflictException('该邮箱已被使用');
      }
    }
    await this.userRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { id };
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.findOne(id);
    await this.userRepository.update(id, { status });
    return this.findOne(id);
  }

  async getDepartments() {
    const rows = await this.userRepository
      .createQueryBuilder('user')
      .select('DISTINCT user.dept', 'dept')
      .where("user.dept <> ''")
      .getRawMany();
    return rows.map((r) => r.dept);
  }
}
