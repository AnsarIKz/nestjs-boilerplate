import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsNumber,
  IsPositive,
  IsEnum,
  IsEmail,
  IsPhoneNumber,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class BillItemDto {
  @ApiProperty({
    description: 'Название блюда',
    example: 'Хинкали с мясом',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Количество порций',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Цена за единицу в тенге',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Общая стоимость (количество × цена)',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: 'Дополнительные заметки к блюду',
    example: 'Без лука',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBillDto {
  @ApiProperty({
    description: 'ID ресторана',
    example: 'uuid-string',
  })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({
    description: 'ID бронирования (необязательно для walk-in клиентов)',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({
    description: 'Имя клиента',
    example: 'Иван Петров',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Телефон клиента',
    example: '+77001234567',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('RU')
  customerPhone?: string;

  @ApiProperty({
    description: 'Email клиента',
    example: 'ivan@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({
    description: 'Список заказанных блюд',
    type: [BillItemDto],
    example: [
      {
        name: 'Хинкали с мясом',
        quantity: 10,
        price: 500,
        total: 5000,
        notes: 'Без лука',
      },
      {
        name: 'Хачапури по-аджарски',
        quantity: 2,
        price: 1200,
        total: 2400,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @ApiProperty({
    description: 'Процент скидки',
    example: 10,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiProperty({
    description: 'Процент налога',
    example: 12,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @ApiProperty({
    description: 'Плата за обслуживание в тенге',
    example: 1000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

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
    description: 'Заметки к счету',
    example: 'Корпоративный ужин',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Внешний ID из системы ресторана',
    example: 'REST_BILL_001',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({
    description: 'Дополнительные данные из API ресторана',
    example: { tableNumber: 5, waiterName: 'Анна' },
    required: false,
  })
  @IsOptional()
  externalData?: any;
}
