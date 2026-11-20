import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { SEARCH_TERM_MAX, SEARCH_TERM_MIN } from '../product-search.service';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** GET /products/search — instant results while typing. */
export class ProductSearchQueryDto {
  @Transform(trim)
  @IsString()
  @Length(SEARCH_TERM_MIN, SEARCH_TERM_MAX)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;
}

/** POST /products/search/log — a search the customer submitted or acted on. */
export class LogSearchDto {
  @Transform(trim)
  @IsString()
  @Length(SEARCH_TERM_MIN, SEARCH_TERM_MAX)
  q!: string;
}
