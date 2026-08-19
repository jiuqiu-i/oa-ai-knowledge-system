import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { QueryApprovalDto } from './dto/query-approval.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('审批管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  @Post()
  @ApiOperation({ summary: '提交审批' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateApprovalDto) {
    return this.approvalsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '审批列表' })
  findAll(@Query() query: QueryApprovalDto) {
    return this.approvalsService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: '我的申请' })
  findMyApprovals(@CurrentUser('id') userId: string, @Query() query: QueryApprovalDto) {
    return this.approvalsService.findMyApprovals(userId, query);
  }

  @Get('pending/stats')
  @ApiOperation({ summary: '待处理统计' })
  findPendingStats(@CurrentUser() user: User) {
    return this.approvalsService.findPendingStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: '审批详情' })
  findOne(@Param('id') id: string) {
    return this.approvalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改申请' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateApprovalDto,
  ) {
    return this.approvalsService.update(id, userId, dto);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '审批通过/驳回' })
  review(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: ReviewApprovalDto) {
    return this.approvalsService.review(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除审批' })
  remove(@Param('id') id: string) {
    return this.approvalsService.remove(id);
  }
}
