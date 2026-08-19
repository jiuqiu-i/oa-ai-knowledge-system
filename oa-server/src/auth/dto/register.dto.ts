import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: '张三', description: '用户名' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'zhangsan@example.com', description: '邮箱' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ example: '123456', description: '密码' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;

  @ApiProperty({ example: '技术部', description: '部门', required: false })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiProperty({ example: 'user', description: '角色', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
