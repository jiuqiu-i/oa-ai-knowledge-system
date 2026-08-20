import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConfig } from '../entities/ai-config.entity';
import { SaveAiConfigDto } from './dto/save-ai-config.dto';

@Injectable()
export class AiConfigService {
  constructor(
    @InjectRepository(AiConfig)
    private configRepository: Repository<AiConfig>,
  ) {}

  /** 获取配置（若不存在则创建默认配置）*/
  async getConfig(): Promise<AiConfig> {
    let config = await this.configRepository.findOne({ where: {} });
    if (!config) {
      config = this.configRepository.create();
      config = await this.configRepository.save(config);
    }
    return config;
  }

  /** 更新配置 */
  async saveConfig(dto: SaveAiConfigDto): Promise<AiConfig> {
    let config = await this.configRepository.findOne({ where: {} });
    if (!config) {
      config = this.configRepository.create(dto);
    } else {
      Object.assign(config, dto);
    }
    return this.configRepository.save(config);
  }
}
