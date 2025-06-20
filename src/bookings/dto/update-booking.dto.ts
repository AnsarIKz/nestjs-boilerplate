import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './create-booking.dto';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiProperty({
    description: 'Статус бронирования',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description: 'Внутренние заметки для ресторана',
    example: 'VIP клиент, особое внимание',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
