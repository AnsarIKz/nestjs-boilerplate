import { IsString, IsEmail, IsOptional, IsPhoneNumber, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({
    example: '+77001234567',
    description: 'Admin phone number',
  })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'admin@example.com',
    description: 'Admin email address (optional)',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'adminPassword123',
    description: 'Admin password',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Admin',
    description: 'Admin first name',
  })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    example: 'User',
    description: 'Admin last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;
}
