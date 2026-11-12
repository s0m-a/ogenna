import { MovementReason } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, NotEquals } from 'class-validator';

export class AdjustInventoryDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @NotEquals(0, { message: 'delta must not be zero' })
  delta: number;

  @IsEnum(MovementReason)
  reason: MovementReason;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
