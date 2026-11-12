import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class BootstrapDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  password: string;
}
