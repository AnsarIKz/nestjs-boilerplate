import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

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
