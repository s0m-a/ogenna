import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SignUploadDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9/_-]+$/, {
    message: 'folder may contain letters, numbers, hyphens, underscores and slashes only',
  })
  @MaxLength(200)
  folder?: string;
}
