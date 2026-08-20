import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('该邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      role: dto.role || UserRole.USER,
      password: hashedPassword,
    });
    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    console.log(user);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    const { password, ...userInfo } = user;

    return {
      token,
      user: userInfo,
    };
  }

  /** 管理员专用登录：校验凭据 + 强制要求 ADMIN 角色 */
  async adminLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (result.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('该账号无管理端登录权限');
    }
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'dept', 'avatarColor', 'status', 'createdAt'],
    });
    return user;
  }
}
