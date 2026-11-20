import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;


export class CreateOrderDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName: string;

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
}
