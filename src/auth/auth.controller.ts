import {
  Controller,
  Body,
  UseGuards,
  Delete,
  Get,
  Inject,
  Post,
  Query,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@app/config/config.service';
import { UsersService } from '@app/users/services/users.service';
import { AuthService } from './auth.service';
import { SendVerificationCodeDto } from './dto/create-user.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtService } from '@nestjs/jwt';

@ApiTags('auth')
@Controller('/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('send-verification')
  @ApiOperation({ summary: 'Send SMS verification code to phone number' })
  @ApiBody({
    type: SendVerificationCodeDto,
    description: 'Phone number for verification',
    examples: {
      example1: {
        value: {
          phoneNumber: '+77001234567',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Verification code sent successfully',
    schema: {
      example: {
        message: 'Verification code sent to phone number. It will expire in 5 minutes.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number or send failed' })
  async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    this.logger.log(`Sending verification code to: ${dto.phoneNumber}`);
    return this.authService.sendVerificationCode(dto);
  }

  @Post('verify-and-register')
  @ApiOperation({ summary: 'Verify phone and create user account' })
  @ApiBody({
    type: VerifyPhoneDto,
    description: 'Phone verification data and user info',
  })
  @ApiResponse({
    status: 201,
    description: 'User created and verified successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: '123e4567-e89b-12d3-a456-426614174000',
        user: {
          id: 'uuid',
          phoneNumber: '+77001234567',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
        message: 'Account created successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 409, description: 'Phone number already in use' })
  async verifyAndRegister(@Body() dto: VerifyPhoneDto) {
    this.logger.log(`Verifying and registering user: ${dto.phoneNumber}`);
    return this.authService.verifyPhoneAndCreateUser(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login user with phone number and password' })
  @ApiBody({
    type: LoginDto,
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: '123e4567-e89b-12d3-a456-426614174000',
        user: {
          id: 'uuid',
          phoneNumber: '+77001234567',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(@Request() req) {
    this.logger.log(`Logging in user: ${req.user?.phoneNumber}`);
    return this.authService.login(req.user);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({
    schema: {
      properties: {
        refresh_token: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'New access token generated successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid refresh token',
  })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    this.logger.log('Refreshing token');
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and revoke refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(@Request() req) {
    this.logger.log(`Logging out user: ${req.user.userId}`);
    return this.authService.logout(req.user.userId);
  }

  @Get('token')
  @ApiOperation({ summary: 'Verify or fetch a token' })
  @ApiQuery({
    name: 'token',
    required: false,
    description: 'Token to verify',
    type: String,
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'User ID associated with the token',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Token information',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        id: 'user-uuid',
      },
    },
  })
  getOrVerifyToken(@Query('token') token?: string, @Query('id') id?: string) {
    this.logger.log(`Verifying token: ${token} for ID: ${id}`);
    return { token, id };
  }

  @Post('token')
  @ApiOperation({ summary: 'Generate a new token' })
  @ApiResponse({
    status: 201,
    description: 'Token generated successfully',
    schema: {
      example: {
        message: 'Token generated successfully',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  generateToken() {
    return { message: 'Token generation not yet implemented' };
  }

  @Delete('token')
  @ApiOperation({ summary: 'Delete a token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Token deleted successfully',
    schema: {
      example: {
        message: 'Token deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  deleteToken() {
    this.logger.log('Deleting token');
    return { message: 'Token deleted' };
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user session info' })
  @ApiResponse({
    status: 200,
    description: 'Current user session',
  })
  async getSession(@Request() req) {
    return {
      user: {
        id: req.user.userId,
        phoneNumber: req.user.phoneNumber,
        role: req.user.role,
      },
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send password reset code to phone number' })
  @ApiBody({
    schema: {
      properties: {
        phoneNumber: {
          type: 'string',
          example: '+77001234567',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reset code sent if phone number exists',
  })
  async forgotPassword(@Body('phoneNumber') phoneNumber: string) {
    this.logger.log(`Password reset requested for: ${phoneNumber}`);
    return this.authService.forgotPassword(phoneNumber);
  }

  @Post('confirm-forgot-password')
  @ApiOperation({ summary: 'Confirm password reset with code' })
  @ApiBody({
    schema: {
      properties: {
        phoneNumber: { type: 'string', example: '+77001234567' },
        code: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: 'newPassword123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code',
  })
  async confirmForgotPassword(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ) {
    this.logger.log(`Confirming password reset for: ${phoneNumber}`);
    return this.authService.confirmForgotPassword(phoneNumber, code, newPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or incorrect old password',
  })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Password change requested for user: ${req.user.userId}`);
    await this.authService.changePassword(req.user.userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Post('create-admin')
  @ApiOperation({ summary: 'Create admin account (internal use)' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Phone number already in use',
  })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    this.logger.log(`Creating admin: ${createAdminDto.phoneNumber}`);
    return this.authService.createAdmin(createAdminDto);
  }
}
