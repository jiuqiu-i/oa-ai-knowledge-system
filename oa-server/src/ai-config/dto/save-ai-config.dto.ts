import {
  IsBoolean,
  IsString,
  IsNumber,
  IsOptional,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class SaveAiConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @MaxLength(50)
  provider: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  apiKey?: string;

  @IsString()
  @MaxLength(100)
  model: string;

  @IsNumber()
  @Min(0)
  @Max(2)
  temperature: number;

  @IsNumber()
  @Min(1)
  @Max(32768)
  maxTokens: number;
}
