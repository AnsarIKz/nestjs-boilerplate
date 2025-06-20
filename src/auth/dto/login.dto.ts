import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+77001234567',
    description: 'Phone number',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: 'Admin123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
