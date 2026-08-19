import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: '张三' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'zhangsan@example.com' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;

  @ApiProperty({ example: 'user', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: '技术部', required: false })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiProperty({ example: 'active', enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ example: '#3b82f6', required: false })
  @IsOptional()
  @IsString()
  avatarColor?: string;
}
