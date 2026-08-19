import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApprovalType, ApprovalUrgency } from '../../entities/approval.entity';

export class CreateApprovalDto {
  @ApiProperty({ enum: ApprovalType })
  @IsNotEmpty()
  @IsEnum(ApprovalType)
  type: ApprovalType;

  @ApiProperty()
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiProperty({ enum: ApprovalUrgency, required: false })
  @IsOptional()
  @IsEnum(ApprovalUrgency)
  urgency?: ApprovalUrgency;
}
