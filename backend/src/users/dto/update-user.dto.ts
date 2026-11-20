import { UserRole } from '@prisma/client';
import { STAFF_ROLES } from '../staff-roles';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  // Staff management only — customer accounts are created through Google sign-in.
  @IsIn(STAFF_ROLES)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
