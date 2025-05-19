import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@rama.gg',
    description: 'User email address',
  })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage('validate.email.invalid'),
    },
  )
  @IsNotEmpty({
    message: i18nValidationMessage('validate.email.required'),
  })
  readonly email: string;
}
