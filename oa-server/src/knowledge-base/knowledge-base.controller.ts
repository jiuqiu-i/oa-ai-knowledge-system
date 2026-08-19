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
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKbDto } from './dto/create-kb.dto';
import { UpdateKbDto } from './dto/update-kb.dto';
import { QueryKbDto } from './dto/query-kb.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('知识库')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private kbService: KnowledgeBaseService) {}

  @Post()
  @ApiOperation({ summary: '创建文档' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateKbDto) {
    return this.kbService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '文档列表/搜索' })
  findAll(@Query() query: QueryKbDto) {
    return this.kbService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: '分类列表' })
  getCategories() {
    return this.kbService.getCategories();
  }

  @Get('hot')
  @ApiOperation({ summary: '热门文档' })
  getHotDocs() {
    return this.kbService.getHotDocs();
  }

  @Get(':id')
  @ApiOperation({ summary: '文档详情' })
  async findOne(@Param('id') id: string) {
    return this.kbService.incrementViews(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新文档' })
  update(@Param('id') id: string, @Body() dto: UpdateKbDto) {
    return this.kbService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文档' })
  remove(@Param('id') id: string) {
    return this.kbService.remove(id);
  }
}
