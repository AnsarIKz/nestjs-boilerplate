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
import { ApiProperty } from '@nestjs/swagger';
import { PriceRange, RestaurantFeature, CuisineType } from '@prisma/client';

export class CreateRestaurantDto {
  @ApiProperty({
    description: 'Название ресторана',
    example: 'La Bella Italia',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Описание ресторана',
    example: 'Уютный итальянский ресторан в центре города',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Адрес ресторана',
    example: 'ул. Абая 123, Алматы',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Номер телефона ресторана',
    example: '+77001234567',
  })
  @IsPhoneNumber('RU')
  phoneNumber: string;

  @ApiProperty({
    description: 'Email ресторана',
    example: 'info@labellaitalia.kz',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Веб-сайт ресторана',
    example: 'https://labellaitalia.kz',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Типы кухни',
    example: ['ITALIAN', 'GEORGIAN'],
    enum: CuisineType,
    isArray: true,
    enumName: 'CuisineType',
  })
  @IsArray()
  @IsEnum(CuisineType, { each: true })
  cuisine: CuisineType[];

  @ApiProperty({
    description: 'Ценовая категория',
    enum: PriceRange,
    example: PriceRange.MODERATE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PriceRange)
  priceRange?: PriceRange;

  @ApiProperty({
    description: 'Рейтинг ресторана (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Вместимость ресторана (количество гостей)',
    example: 50,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: 'URL изображений ресторана',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @ApiProperty({
    description: 'Часы работы ресторана',
    example: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
  })
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  openingHours: Record<string, { open: string; close: string }>;

  @ApiProperty({
    description:
      'Особенности и удобства ресторана. Включает: основные удобства (WIFI, PARKING, AIR_CONDITIONING), развлечения (LIVE_MUSIC, KARAOKE), семейные опции (KIDS_MENU, PLAYGROUND), диетические варианты (VEGAN_OPTIONS, HALAL_FOOD), грузинские особенности (KHINKALI, KHACHAPURI, GEORGIAN_CUISINE) и многое другое',
    example: ['WIFI', 'PARKING', 'OUTDOOR_SEATING', 'LIVE_MUSIC', 'KHINKALI'],
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
  features?: RestaurantFeature[];

  @ApiProperty({
    description: 'Активен ли ресторан',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
