import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { KnowledgeBase } from '../entities/kb.entity';
import { CreateKbDto } from './dto/create-kb.dto';
import { UpdateKbDto } from './dto/update-kb.dto';
import { QueryKbDto } from './dto/query-kb.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(KnowledgeBase)
    private kbRepository: Repository<KnowledgeBase>,
  ) {}

  async create(userId: string, dto: CreateKbDto) {
    const doc = this.kbRepository.create({
      ...dto,
      authorId: userId,
      tags: dto.tags || [],
    });
    return this.kbRepository.save(doc);
  }

  async findAll(query: QueryKbDto) {
    const { keyword, category, tag, page = 1, pageSize = 10 } = query;
    const qb = this.kbRepository.createQueryBuilder('kb').leftJoinAndSelect('kb.author', 'author');

    if (keyword) {
      qb.andWhere('(kb.title LIKE :keyword OR kb.content LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }
    if (category) {
      qb.andWhere('kb.category = :category', { category });
    }
    if (tag) {
      qb.andWhere('kb.tags LIKE :tag', { tag: `%"${tag}"%` });
    }

    const [list, total] = await qb
      .orderBy('kb.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findOne(id: string) {
    const doc = await this.kbRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!doc) {
      throw new NotFoundException('文档不存在');
    }
    return doc;
  }

  async incrementViews(id: string) {
    await this.kbRepository.increment({ id }, 'views', 1);
    return this.findOne(id);
  }

  async update(id: string, dto: UpdateKbDto) {
    await this.findOne(id);
    await this.kbRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    await this.kbRepository.remove(doc);
    return { id };
  }

  async getCategories() {
    const rows = await this.kbRepository
      .createQueryBuilder('kb')
      .select('DISTINCT kb.category', 'category')
      .getRawMany();
    return rows.map((r) => r.category);
  }

  async getHotDocs(limit = 10) {
    return this.kbRepository.find({
      order: { views: 'DESC' },
      take: limit,
      select: ['id', 'title', 'category', 'views', 'createdAt'],
    });
  }
}
