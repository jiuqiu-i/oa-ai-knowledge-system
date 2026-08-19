import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApprovalType, ApprovalUrgency } from '../../entities/approval.entity';

export class UpdateApprovalDto {
  @ApiProperty({ enum: ApprovalType, required: false })
  @IsOptional()
  @IsEnum(ApprovalType)
  type?: ApprovalType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

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
