import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PriceRange, RestaurantFeature, CuisineType } from '@prisma/client';

export class AdvancedSearchDto {
  @ApiProperty({
    description: 'Номер страницы',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({
    description: 'Поиск по названию ресторана',
    example: 'Хинкали',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Поиск по описанию ресторана',
    example: 'грузинский',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Поиск по адресу',
    example: 'Достык',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Общий поисковый запрос (поиск по названию, описанию и адресу)',
    example: 'итальянский пицца',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    description: 'Фильтр по типу кухни',
    enum: CuisineType,
    example: CuisineType.GEORGIAN,
    required: false,
  })
  @IsOptional()
  @IsEnum(CuisineType)
  cuisine?: CuisineType;

  @ApiProperty({
    description: 'Фильтр по нескольким типам кухни',
    example: [CuisineType.GEORGIAN, CuisineType.ITALIAN],
    enum: CuisineType,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CuisineType, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  cuisines?: CuisineType[];

  @ApiProperty({
    description: 'Минимальный ценовой диапазон',
    enum: PriceRange,
    example: PriceRange.BUDGET,
    required: false,
  })
  @IsOptional()
  @IsEnum(PriceRange)
  minPriceRange?: PriceRange;

  @ApiProperty({
    description: 'Максимальный ценовой диапазон',
    enum: PriceRange,
    example: PriceRange.LUXURY,
    required: false,
  })
  @IsOptional()
  @IsEnum(PriceRange)
  maxPriceRange?: PriceRange;

  @ApiProperty({
    description: 'Точный ценовой диапазон',
    enum: PriceRange,
    example: PriceRange.MODERATE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PriceRange)
  priceRange?: PriceRange;

  @ApiProperty({
    description: 'Минимальный рейтинг',
    example: 4.0,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Максимальный рейтинг',
    example: 5.0,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  maxRating?: number;

  @ApiProperty({
    description: 'Минимальная вместимость',
    example: 20,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minCapacity?: number;

  @ApiProperty({
    description: 'Максимальная вместимость',
    example: 100,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @ApiProperty({
    description: 'Обязательные особенности ресторана (должны быть все)',
    example: ['WIFI', 'PARKING'],
    enum: [
      'WIFI',
      'PARKING',
      'OUTDOOR_SEATING',
      'LIVE_MUSIC',
      'KARAOKE',
      'PRIVATE_DINING',
      'KIDS_MENU',
      'PLAYGROUND',
      'PET_FRIENDLY',
      'WHEELCHAIR_ACCESSIBLE',
      'AIR_CONDITIONING',
      'FIREPLACE',
      'BAR',
      'WINE_CELLAR',
      'BUFFET',
      'TAKEAWAY',
      'DELIVERY',
      'RESERVATION_REQUIRED',
      'CREDIT_CARDS_ACCEPTED',
      'CASH_ONLY',
      'VEGAN_OPTIONS',
      'GLUTEN_FREE_OPTIONS',
      'HALAL_FOOD',
      'KOSHER_FOOD',
      'BREAKFAST',
      'BRUNCH',
      'LUNCH',
      'DINNER',
      'LATE_NIGHT',
      'HOOKAH',
      'GEORGIAN_CUISINE',
      'KHINKALI',
      'KHACHAPURI',
      'MTSVADI',
      'CHURCHKHELA',
      'CHACHA_TASTING',
      'TRADITIONAL_MUSIC',
      'NATIONAL_COSTUMES',
      'TAMADA_SERVICE',
    ],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RestaurantFeature, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  requiredFeatures?: RestaurantFeature[];

  @ApiProperty({
    description: 'Желательные особенности ресторана (достаточно одной)',
    example: ['LIVE_MUSIC', 'KARAOKE'],
    enum: [
      'WIFI',
      'PARKING',
      'OUTDOOR_SEATING',
      'LIVE_MUSIC',
      'KARAOKE',
      'PRIVATE_DINING',
      'KIDS_MENU',
      'PLAYGROUND',
      'PET_FRIENDLY',
      'WHEELCHAIR_ACCESSIBLE',
      'AIR_CONDITIONING',
      'FIREPLACE',
      'BAR',
      'WINE_CELLAR',
      'BUFFET',
      'TAKEAWAY',
      'DELIVERY',
      'RESERVATION_REQUIRED',
      'CREDIT_CARDS_ACCEPTED',
      'CASH_ONLY',
      'VEGAN_OPTIONS',
      'GLUTEN_FREE_OPTIONS',
      'HALAL_FOOD',
      'KOSHER_FOOD',
      'BREAKFAST',
      'BRUNCH',
      'LUNCH',
      'DINNER',
      'LATE_NIGHT',
      'HOOKAH',
      'GEORGIAN_CUISINE',
      'KHINKALI',
      'KHACHAPURI',
      'MTSVADI',
      'CHURCHKHELA',
      'CHACHA_TASTING',
      'TRADITIONAL_MUSIC',
      'NATIONAL_COSTUMES',
      'TAMADA_SERVICE',
    ],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RestaurantFeature, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  optionalFeatures?: RestaurantFeature[];

  @ApiProperty({
    description: 'Сортировка результатов',
    enum: ['rating', 'name', 'priceRange', 'capacity', 'createdAt'],
    example: 'rating',
    required: false,
    default: 'rating',
  })
  @IsOptional()
  @IsEnum(['rating', 'name', 'priceRange', 'capacity', 'createdAt'])
  sortBy?: 'rating' | 'name' | 'priceRange' | 'capacity' | 'createdAt' = 'rating';

  @ApiProperty({
    description: 'Направление сортировки',
    enum: ['asc', 'desc'],
    example: 'desc',
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
