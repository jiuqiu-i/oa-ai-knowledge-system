import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;
}
