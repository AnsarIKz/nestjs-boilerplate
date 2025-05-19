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
import { MailerService } from '@app/mailer/mailer.service';
import { ConfigService } from '@app/config/config.service';
import { UsersService } from '@app/users/services/users.service';
import { AuthInstanceInjectKey } from './auth.constant';
import { InjectAuthInstance } from './auth.interface';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
    private readonly mailerService: MailerService,
    private readonly authService: AuthService,
    @Inject(AuthInstanceInjectKey)
    private readonly authInstance: InjectAuthInstance,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Start registration process by requesting email verification' })
  @ApiBody({
    type: CreateUserDto,
    description: 'Email for registration',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Verification code sent successfully',
    schema: {
      example: {
        message: 'Verification code sent to email. It will expire in 5 minutes.',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Starting registration for email: ${createUserDto.email}`);
    return this.authService.create(createUserDto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login user with credentials' })
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
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+77001234567',
          role: 'USER',
          createdAt: '2024-03-20T12:00:00Z',
          updatedAt: '2024-03-20T12:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(@Request() req) {
    this.logger.log(`Logging in user: ${req.user?.email}`);
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

  // @Get('providers')
  // @ApiOperation({ summary: 'Get available auth providers' })
  // @ApiResponse({ status: 200, description: 'List of providers' })
  // getProviders() {
  //   return this.authInstance.get().api.getProviders();
  // }

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
  async generateToken() {
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
  @ApiOperation({ summary: 'Get current user session' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Current session information',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'user@rama.gg',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
        expiresAt: '2024-03-20T13:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getSession(@Request() req) {
    const userId = req.user.userId;
    this.logger.log(`Fetching session info for user: ${userId}`);

    // Fetch user data from database
    const user = await this.usersService.findOne(userId);

    // Extract token and determine expiration
    const token = req.headers.authorization?.split(' ')[1];
    const expiresAt = this.getTokenExpiration(token);

    return { user, expiresAt };
  }

  /**
   * Extracts expiration date from JWT token
   * @param token JWT token string
   * @returns Date object or null if unable to extract
   */
  private getTokenExpiration(token?: string): Date | null {
    if (!token) return null;

    try {
      const decoded = this.jwtService.decode(token);
      return decoded && typeof decoded === 'object' && decoded.exp
        ? new Date(decoded.exp * 1000)
        : null;
    } catch (error) {
      this.logger.error('Error decoding token:', error);
      return null;
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@rama.gg',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset code sent if email exists',
    schema: {
      example: {
        message: 'If the email exists, a reset code will be sent',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format',
  })
  async forgotPassword(@Body('email') email: string) {
    this.logger.log(`Password reset requested for email: ${email}`);
    return this.authService.forgotPassword(email);
  }

  @Post('confirm-forgot-password')
  @ApiOperation({ summary: 'Confirm password reset with verification code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@rama.gg',
        },
        code: {
          type: 'string',
          example: '123456',
        },
        newPassword: {
          type: 'string',
          example: 'NewPassword123!',
        },
      },
      required: ['email', 'code', 'newPassword'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: {
        message: 'Password has been reset successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  async confirmForgotPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ) {
    this.logger.log(`Confirming password reset for email: ${email}`);
    return this.authService.confirmForgotPassword(email, code, newPassword);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete registration by verifying email and creating user account' })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Email verification and user registration data',
    examples: {
      example1: {
        value: {
          email: 'user@rama.gg',
          code: '123456',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+77001234567',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified and user created successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'user@rama.gg',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+77001234567',
          role: 'USER',
          createdAt: '2024-03-20T12:00:00Z',
          updatedAt: '2024-03-20T12:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid verification code',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    this.logger.log(`Completing registration for email: ${verifyEmailDto.email}`);
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@rama.gg',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
    schema: {
      example: {
        message: 'Verification code sent to email. It will expire in 5 minutes.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or rate limit exceeded',
    schema: {
      example: {
        statusCode: 400,
        message: 'Please wait 60 seconds before requesting a new code',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async resendVerificationCode(@Body('email') email: string) {
    this.logger.log(`Resending verification code to: ${email}`);
    return this.authService.resendVerificationCode(email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password change data',
    examples: {
      example1: {
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid input data' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Current password is incorrect',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Current password is incorrect' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  // AAAAAAAAAAAAAAAAAAAAAAAAA
  //   @Post('admin')
  //   @ApiOperation({ summary: 'Create an admin user' })
  //   @ApiBody({
  //     type: CreateAdminDto,
  //     description: 'Admin user creation data',
  //     examples: {
  //       example1: {
  //         value: {
  //           email: 'admin@example.com',
  //           password: 'Admin123!',
  //           firstName: 'Admin',
  //           lastName: 'User',
  //           phoneNumber: '+1234567890',
  //         },
  //       },
  //     },
  //   })
  //   @ApiResponse({
  //     status: 201,
  //     description: 'Admin user created successfully',
  //     schema: {
  //       example: {
  //         id: 'uuid',
  //         email: 'admin@example.com',
  //         firstName: 'Admin',
  //         lastName: 'User',
  //         phoneNumber: '+1234567890',
  //         role: 'ADMIN',
  //         createdAt: '2024-03-20T12:00:00Z',
  //         updatedAt: '2024-03-20T12:00:00Z',
  //       },
  //     },
  //   })
  //   @ApiResponse({ status: 409, description: 'Email already in use' })
  //   async createAdmin(@Body() createAdminDto: CreateAdminDto) {
  //     this.logger.log(`Creating admin user: ${createAdminDto.email}`);
  //     return this.authService.createAdmin(createAdminDto);
  //   }
}
