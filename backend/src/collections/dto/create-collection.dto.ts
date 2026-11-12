import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens',
  })
  @MaxLength(120)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
