import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUrl,
  IsEmail,
  IsPhoneNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PriceRange } from '@prisma/client';

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  address: string;

  @IsPhoneNumber('RU')
  phoneNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsArray()
  @IsString({ each: true })
  cuisine: string[];

  @IsOptional()
  @IsEnum(PriceRange)
  priceRange?: PriceRange;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  openingHours: Record<string, { open: string; close: string }>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
