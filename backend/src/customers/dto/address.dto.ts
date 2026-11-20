import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Same field rules as checkout (CreateOrderDto) so a saved address always checks out. */
export class CreateAddressDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  label?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  recipientName: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  addressLine1: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
