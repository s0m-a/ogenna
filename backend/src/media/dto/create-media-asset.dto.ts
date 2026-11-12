import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { MediaResourceType } from '@prisma/client';

export class CreateMediaAssetDto {
  @IsString()
  @MaxLength(255)
  publicId: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsUrl({ require_tld: false })
  secureUrl: string;

  @IsOptional()
  @IsEnum(MediaResourceType)
  resourceType?: MediaResourceType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  format?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  folder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;
}
