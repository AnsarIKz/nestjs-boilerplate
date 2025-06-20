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

export class CreateBookingDto {
  @IsString()
  restaurantId: string;

  @IsDateString()
  bookingDate: string;

  @IsString()
  bookingTime: string; // Format: "19:00"

  @IsNumber()
  @Min(1)
  @Max(20)
  guestCount: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsString()
  customerName: string;

  @IsPhoneNumber('RU')
  customerPhone: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}
