import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiConfigService } from './ai-config.service';
import { SaveAiConfigDto } from './dto/save-ai-config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@ApiTags('AI 配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('ai-config')
export class AiConfigController {
  constructor(private aiConfigService: AiConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取 AI 配置' })
  getConfig() {
    return this.aiConfigService.getConfig();
  }

  @Put()
  @ApiOperation({ summary: '保存 AI 配置' })
  saveConfig(@Body() dto: SaveAiConfigDto) {
    return this.aiConfigService.saveConfig(dto);
  }
}
