import { IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationCodeDto {
  @ApiProperty({
    example: '+77001234567',
    description: 'Phone number to send verification code to',
  })
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be valid international format',
  })
  @IsNotEmpty()
  readonly phoneNumber: string;
}
