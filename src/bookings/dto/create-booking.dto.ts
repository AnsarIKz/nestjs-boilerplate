import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Уникальный идентификатор ресторана',
    example: 'uuid-string',
  })
  @IsString()
  restaurantId: string;

  @ApiProperty({
    description: 'Дата бронирования',
    example: '2024-12-25',
    format: 'date',
  })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({
    description: 'Время бронирования',
    example: '19:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  bookingTime: string; // Format: "19:00"

  @ApiProperty({
    description: 'Количество гостей',
    example: 4,
    minimum: 1,
    maximum: 20,
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  guestCount: number;

  @ApiProperty({
    description: 'Особые пожелания или комментарии',
    example: 'Столик у окна, аллергия на орехи',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiProperty({
    description: 'Имя клиента',
    example: 'Иван Иванов',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Номер телефона клиента',
    example: '+77001234567',
  })
  @IsPhoneNumber('RU')
  customerPhone: string;

  @ApiProperty({
    description: 'Email клиента',
    example: 'ivan@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}
