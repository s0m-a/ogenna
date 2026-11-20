import { UserRole } from '@prisma/client';
import { STAFF_ROLES } from '../staff-roles';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  password: string;

  @IsOptional()
  // Staff management only — customer accounts are created through Google sign-in.
  @IsIn(STAFF_ROLES)
  role?: UserRole;
}
