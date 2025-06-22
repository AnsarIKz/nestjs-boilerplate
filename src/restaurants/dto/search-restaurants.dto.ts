import { IsOptional, IsString, IsEnum, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PriceRange, RestaurantFeature } from '@prisma/client';

export class SearchRestaurantsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsEnum(PriceRange)
  priceRange?: PriceRange;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(RestaurantFeature, { each: true })
  features?: RestaurantFeature[];
}
