import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { KnowledgeBase } from '../entities/kb.entity';
import { CreateKbDto } from './dto/create-kb.dto';
import { UpdateKbDto } from './dto/update-kb.dto';
import { QueryKbDto } from './dto/query-kb.dto';
import { RedisService } from '../redis/redis.service';

/**
 * 知识库服务
 * - 全文检索：优先 MySQL FULLTEXT (MATCH AGAINST，中文 ngram)，失败降级 LIKE
 * - 缓存策略：Cache-Aside 模式
 *     读：先查 Redis，未命中查 DB 后回填；
 *     写：创建/更新/删除后主动失效相关 key，保证后续读触发重建
 * - 缓存粒度：热门文档列表、单文档详情；浏览量自增不写回缓存（避免热 key 放大）
 */
@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  // 缓存 key 规范
  private static readonly CACHE_HOT = 'kb:hot';
  private static readonly CACHE_DOC = (id: string) => `kb:doc:${id}`;
  private static readonly CACHE_CATEGORIES = 'kb:categories';

  // 缓存 TTL（秒）
  private static readonly TTL_HOT = 300;       // 热门 5 分钟
  private static readonly TTL_DOC = 600;       // 文档详情 10 分钟
  private static readonly TTL_CATEGORIES = 1800; // 分类 30 分钟

  constructor(
    @InjectRepository(KnowledgeBase)
    private kbRepository: Repository<KnowledgeBase>,
    private redisService: RedisService,
  ) {}

  async create(userId: string, dto: CreateKbDto) {
    const doc = this.kbRepository.create({
      ...dto,
      authorId: userId,
      tags: dto.tags || [],
      attachment: dto.attachment ?? null,
    });
    const saved = await this.kbRepository.save(doc);
    // 写后失效：热门列表与分类受影响
    await this.invalidateListCache();
    return saved;
  }

  async findAll(query: QueryKbDto) {
    const { keyword, category, tag, page = 1, pageSize = 10 } = query;

    // 分类与标签过滤独立构造（与关键词无关）
    const applyFilters = (qb: SelectQueryBuilder<KnowledgeBase>) => {
      if (category) {
        qb.andWhere('kb.category = :category', { category });
      }
      if (tag) {
        qb.andWhere('kb.tags LIKE :tag', { tag: `%"${tag}"%` });
      }
    };

    const paginate = (qb: SelectQueryBuilder<KnowledgeBase>) =>
      qb
        .orderBy('kb.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

    if (keyword) {
      // 优先走 FULLTEXT（需 idx_kb_fulltext ngram 索引）；执行期失败则降级 LIKE 重试
      try {
        const boolExpr = this.toBooleanModeExpr(keyword);
        const qb = this.kbRepository
          .createQueryBuilder('kb')
          .leftJoinAndSelect('kb.author', 'author')
          .where('MATCH(kb.title, kb.content) AGAINST (:boolExpr IN BOOLEAN MODE)', { boolExpr });
        applyFilters(qb);
        const [list, total] = await paginate(qb);
        return { list, total, page, pageSize };
      } catch (e) {
        this.logger.warn(`FULLTEXT 检索失败，降级 LIKE: ${(e as Error).message}`);
      }
      // 降级 LIKE
      const qb = this.kbRepository
        .createQueryBuilder('kb')
        .leftJoinAndSelect('kb.author', 'author')
        .where('(kb.title LIKE :kw OR kb.content LIKE :kw)', { kw: `%${keyword}%` });
      applyFilters(qb);
      const [list, total] = await paginate(qb);
      return { list, total, page, pageSize };
    }

    const qb = this.kbRepository.createQueryBuilder('kb').leftJoinAndSelect('kb.author', 'author');
    applyFilters(qb);
    const [list, total] = await paginate(qb);
    return { list, total, page, pageSize };
  }

  /**
   * 将用户关键词转为 FULLTEXT BOOLEAN MODE 表达式：+token1 +token2 ...
   * 去除 BOOLEAN MODE 特殊字符，避免语法错误。
   */
  private toBooleanModeExpr(keyword: string): string {
    const escaped = keyword.replace(/["+\-<>*()~]/g, ' ').trim();
    if (!escaped) return keyword;
    return escaped
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => `+${t}`)
      .join(' ');
  }

  async findOne(id: string) {
    return this.redisService.getOrSet<KnowledgeBase>(
      KnowledgeBaseService.CACHE_DOC(id),
      KnowledgeBaseService.TTL_DOC,
      async () => {
        const doc = await this.kbRepository.findOne({
          where: { id },
          relations: ['author'],
        });
        if (!doc) {
          throw new NotFoundException('文档不存在');
        }
        return doc;
      },
    );
  }

  async incrementViews(id: string) {
    // 浏览量直接更新 DB，不回写缓存（热 key 避免放大）
    await this.kbRepository.increment({ id }, 'views', 1);
    // 详情缓存中的 views 已过期，失效详情与热门列表
    await this.redisService.invalidate([
      KnowledgeBaseService.CACHE_DOC(id),
      KnowledgeBaseService.CACHE_HOT,
    ]);
    return this.kbRepository.findOne({ where: { id }, relations: ['author'] });
  }

  async update(id: string, dto: UpdateKbDto) {
    await this.findOne(id);
    await this.kbRepository.update(id, dto);
    // 写后失效：详情 + 列表 + 分类
    await this.redisService.invalidate([
      KnowledgeBaseService.CACHE_DOC(id),
      KnowledgeBaseService.CACHE_HOT,
      KnowledgeBaseService.CACHE_CATEGORIES,
    ]);
    return this.kbRepository.findOne({ where: { id }, relations: ['author'] });
  }

  async remove(id: string) {
    const doc = await this.kbRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('文档不存在');
    }
    await this.kbRepository.remove(doc);
    await this.redisService.invalidate([
      KnowledgeBaseService.CACHE_DOC(id),
      KnowledgeBaseService.CACHE_HOT,
      KnowledgeBaseService.CACHE_CATEGORIES,
    ]);
    return { id };
  }

  async getCategories() {
    return this.redisService.getOrSet<string[]>(
      KnowledgeBaseService.CACHE_CATEGORIES,
      KnowledgeBaseService.TTL_CATEGORIES,
      async () => {
        const rows = await this.kbRepository
          .createQueryBuilder('kb')
          .select('DISTINCT kb.category', 'category')
          .getRawMany();
        return rows.map((r) => r.category);
      },
    );
  }

  async getHotDocs(limit = 10) {
    return this.redisService.getOrSet<Partial<KnowledgeBase>[]>(
      KnowledgeBaseService.CACHE_HOT,
      KnowledgeBaseService.TTL_HOT,
      async () => {
        return this.kbRepository.find({
          order: { views: 'DESC' },
          take: limit,
          select: ['id', 'title', 'category', 'views', 'createdAt'],
        });
      },
    );
  }

  private async invalidateListCache() {
    await this.redisService.invalidate([
      KnowledgeBaseService.CACHE_HOT,
      KnowledgeBaseService.CACHE_CATEGORIES,
    ]);
  }
}
