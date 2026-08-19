import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApprovalStatus } from '../../entities/approval.entity';

export class ReviewApprovalDto {
  @ApiProperty({ enum: ApprovalStatus })
  @IsNotEmpty()
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
