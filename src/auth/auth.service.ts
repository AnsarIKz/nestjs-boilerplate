import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import * as bcrypt from 'bcryptjs';
import { SendVerificationCodeDto } from './dto/create-user.dto';
import { PrismaService } from '@app/prisma/prisma.service';
import { Role, VerificationType } from '@prisma/client';
import { SmsService } from '@app/sms/sms.service';
import { ConfigService } from '@app/config/config.service';
import { LoginDto } from './dto/login.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
  private readonly JWT_REFRESH_EXPIRES_IN_DAYS = 30; // 30 days for refresh token

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(phoneNumber: string, pass: string): Promise<any> {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }

    const payload = {
      phoneNumber: existingUser.phoneNumber,
      sub: existingUser.id,
      role: existingUser.role,
    };
    const accessToken = this.jwtService.sign(payload);

    // Create refresh token
    const refreshToken = await this.createRefreshToken(
      existingUser.id,
      this.getIpAddress(),
      this.getUserAgent(),
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      user: existingUser,
    };
  }

  private getIpAddress(): string {
    // In a real app, you would get this from the request
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    // In a real app, you would get this from the request
    return 'Unknown';
  }

  async createRefreshToken(userId: string, ipAddress?: string, userAgent?: string) {
    // Delete any expired refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.JWT_REFRESH_EXPIRES_IN_DAYS);

    const token = uuidv4();

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return refreshToken;
  }

  async refreshToken(token: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.revoked || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = refreshToken.user;
    const payload = { phoneNumber: user.phoneNumber, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Optional: Create a new refresh token and revoke the old one for better security
    const newRefreshToken = await this.createRefreshToken(
      user.id,
      refreshToken.ipAddress || undefined,
      refreshToken.userAgent || undefined,
    );

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revoked: true },
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken.token,
    };
  }

  async revokeToken(token: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      throw new NotFoundException('Token not found');
    }

    return this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revoked: true },
    });
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  private async generateAndStoreCode(
    phoneNumber: string,
    type: VerificationType = VerificationType.REGISTRATION,
  ): Promise<string> {
    // Check for existing code and its creation time
    const existingCode = await this.prisma.verificationCode.findFirst({
      where: { phoneNumber, type },
      orderBy: { createdAt: 'desc' },
    });

    if (existingCode) {
      const timeSinceLastCode = Date.now() - existingCode.createdAt.getTime();
      if (timeSinceLastCode < this.RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((this.RESEND_COOLDOWN_MS - timeSinceLastCode) / 1000);
        throw new BadRequestException(
          `Rate limit exceeded. Please wait ${waitSeconds} seconds before requesting a new verification code.`,
        );
      }
    }

    // Clear any existing codes for this phone number
    await this.prisma.verificationCode.deleteMany({ where: { phoneNumber, type } });

    // Generate and store new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.CODE_TTL_MS);

    await this.prisma.verificationCode.create({
      data: { phoneNumber, code, type, expiresAt },
    });

    return code;
  }

  async sendVerificationCode(dto: SendVerificationCodeDto) {
    try {
      // Generate and store verification code
      const code = await this.generateAndStoreCode(dto.phoneNumber, VerificationType.REGISTRATION);

      // Send SMS with code
      const sent = await this.smsService.sendVerificationCode(dto.phoneNumber, code);

      if (!sent) {
        throw new BadRequestException(
          'Failed to send SMS. Please check phone number or try again later.',
        );
      }

      this.logger.log(`Verification code sent to ${dto.phoneNumber}`);
      return {
        message: 'Verification code sent to phone number. It will expire in 5 minutes.',
      };
    } catch (error) {
      this.logger.error(`Failed to send verification to ${dto.phoneNumber}:`, error);

      // Re-throw BadRequestException with original message (cooldown, etc.)
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For other errors, throw generic message
      throw new BadRequestException('Failed to send verification code. Please try again later.');
    }
  }

  async verifyPhoneAndCreateUser(dto: VerifyPhoneDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Find and validate verification code
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        phoneNumber: dto.phoneNumber,
        code: dto.code,
        type: VerificationType.REGISTRATION,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Delete used verification code
    await this.prisma.verificationCode.delete({ where: { id: record.id } });

    // Create user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: `${dto.phoneNumber}@temp.local`, // Temporary email, can be updated later
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const payload = { phoneNumber: user.phoneNumber, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(
      user.id,
      this.getIpAddress(),
      this.getUserAgent(),
    );

    this.logger.log(`User created and verified: ${dto.phoneNumber}`);
    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      user,
      message: 'Account created successfully',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Revoke all refresh tokens to force re-login
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    this.logger.log(`Password changed for user: ${userId}`);
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: createAdminDto.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('Admin with this phone number already exists');
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    const admin = await this.prisma.user.create({
      data: {
        email: createAdminDto.email || `${createAdminDto.phoneNumber}@admin.local`,
        password: hashedPassword,
        firstName: createAdminDto.firstName,
        lastName: createAdminDto.lastName,
        phoneNumber: createAdminDto.phoneNumber,
        role: Role.ADMIN,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Admin created: ${createAdminDto.phoneNumber}`);
    return admin;
  }

  async forgotPassword(phoneNumber: string) {
    const user = await this.prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the phone number exists, a reset code has been sent.' };
    }

    try {
      const code = await this.generateAndStoreCode(phoneNumber, VerificationType.PASSWORD_RESET);
      const sent = await this.smsService.sendPasswordResetCode(phoneNumber, code);

      if (!sent) {
        throw new BadRequestException('Failed to send reset SMS. Please try again later.');
      }

      return { message: 'Password reset code sent to your phone.' };
    } catch (error) {
      this.logger.error(`Failed to send password reset to ${phoneNumber}:`, error);

      // Re-throw BadRequestException with original message (cooldown, etc.)
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to send reset code. Please try again later.');
    }
  }

  async confirmForgotPassword(phoneNumber: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        phoneNumber,
        code,
        type: VerificationType.PASSWORD_RESET,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    await this.prisma.verificationCode.delete({ where: { id: verificationCode.id } });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return { message: 'Password reset successfully' };
  }
}
