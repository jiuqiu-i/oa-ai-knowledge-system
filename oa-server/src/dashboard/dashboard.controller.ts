import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

@ApiTags('仪表盘')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '核心统计数据' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('trends')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '趋势数据' })
  getTrends() {
    return this.dashboardService.getTrends();
  }

  @Get('dept-contributions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '部门贡献排行' })
  getDeptContributions() {
    return this.dashboardService.getDeptContributions();
  }

  @Get('overview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '仪表盘总览' })
  getOverview() {
    return this.dashboardService.getOverview();
  }
}
