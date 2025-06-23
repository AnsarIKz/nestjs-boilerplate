import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillStatus, PaymentMethod } from '@prisma/client';

export class SearchBillsDto {
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
    description: 'ID ресторана для фильтрации',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @ApiProperty({
    description: 'ID бронирования для фильтрации',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({
    description: 'Статус счета',
    enum: BillStatus,
    example: BillStatus.PAID,
    required: false,
  })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @ApiProperty({
    description: 'Способ оплаты',
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Поиск по номеру счета',
    example: 'BILL-2024-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  billNumber?: string;

  @ApiProperty({
    description: 'Поиск по имени клиента',
    example: 'Иван',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({
    description: 'Поиск по телефону клиента',
    example: '+77001234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description: 'Дата создания от (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Дата создания до (YYYY-MM-DD)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'Минимальная сумма счета',
    example: 1000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({
    description: 'Максимальная сумма счета',
    example: 50000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}
