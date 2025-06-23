import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { BillStatus, PaymentMethod } from '@prisma/client';
import { CreateBillDto } from './create-bill.dto';

export class UpdateBillDto extends PartialType(CreateBillDto) {
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
    description: 'URL чека/квитанции',
    example: 'https://example.com/receipts/BILL-2024-001.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
