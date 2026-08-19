import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ChatDto {
  @ApiProperty({ description: '用户输入消息' })
  @IsNotEmpty({ message: '消息不能为空' })
  @IsString()
  message: string;

  @ApiProperty({ description: '会话ID，为空则新建', required: false })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({ description: '是否流式返回', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean = false;
}
