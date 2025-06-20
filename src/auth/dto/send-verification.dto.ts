import { IsPhoneNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationDto {
  @ApiProperty({
    example: '+77001234567',
    description: 'Phone number to send verification code to',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}
