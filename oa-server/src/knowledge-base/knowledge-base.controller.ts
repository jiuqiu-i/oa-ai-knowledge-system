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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKbDto } from './dto/create-kb.dto';
import { UpdateKbDto } from './dto/update-kb.dto';
import { QueryKbDto } from './dto/query-kb.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const KB_UPLOAD_DIR = join(process.cwd(), 'uploads', 'kb');

// 允许的文件扩展名（白名单）
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.md', '.csv', '.zip', '.rar', '.png', '.jpg', '.jpeg', '.gif',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function ensureUploadDir() {
  if (!existsSync(KB_UPLOAD_DIR)) {
    mkdirSync(KB_UPLOAD_DIR, { recursive: true });
  }
}

@ApiTags('知识库')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private kbService: KnowledgeBaseService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传知识库附件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, KB_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          // 文件名：时间戳 + 随机数 + 原始扩展名，避免重名覆盖
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return cb(
            new BadRequestException(`不支持的文件类型: ${ext}，允许: ${ALLOWED_EXTENSIONS.join(', ')}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    // multer 按 Latin-1 解码文件名，中文会乱码，这里转回 UTF-8
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // 返回可访问的 URL 路径（由 main.ts 中 useStaticAssets 映射）
    const url = `/uploads/kb/${file.filename}`;
    return {
      filename: file.filename,
      originalname,
      size: file.size,
      mimetype: file.mimetype,
      url,
    };
  }

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
