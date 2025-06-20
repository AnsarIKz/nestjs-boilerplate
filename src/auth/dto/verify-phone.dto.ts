import { IsString, IsNotEmpty, IsPhoneNumber, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneDto {
  @ApiProperty({
    example: '+77001234567',
    description: 'Phone number to verify',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code sent to phone',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  code: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100, { message: 'Password must be between 6 and 100 characters' })
  password: string;
}
