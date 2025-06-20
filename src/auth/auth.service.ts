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
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '@app/prisma/prisma.service';
import { Role } from '@prisma/client';
import { MailerService } from '@app/mailer/mailer.service';
import { ConfigService } from '@app/config/config.service';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
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
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
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

    const payload = { email: existingUser.email, sub: existingUser.id, role: existingUser.role };
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
    const payload = { email: user.email, sub: user.id, role: user.role };
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

  private async generateAndStoreCode(email: string): Promise<string> {
    // Check for existing code and its creation time
    const existingCode = await this.prisma.verificationCode.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (existingCode) {
      const timeSinceLastCode = Date.now() - existingCode.createdAt.getTime();
      if (timeSinceLastCode < this.RESEND_COOLDOWN_MS) {
        throw new BadRequestException(
          `Please wait ${Math.ceil((this.RESEND_COOLDOWN_MS - timeSinceLastCode) / 1000)} seconds before requesting a new code`,
        );
      }
    }

    // remove any existing codes for this email
    await this.prisma.verificationCode.deleteMany({ where: { email } });

    const code = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expiresAt = new Date(Date.now() + this.CODE_TTL_MS);

    await this.prisma.verificationCode.create({
      data: { email, code, expiresAt },
    });

    return code;
  }

  /**
   * Step 1: Register - generate and send verification code
   */
  async create(dto: CreateUserDto) {
    const { email } = dto;

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // generate and persist code
    const code = await this.generateAndStoreCode(email);
    // send email
    await this.mailerService.sendVerificationEmail(email, code);

    return {
      message: 'Verification code sent to email. It will expire in 5 minutes.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { email, code, password, firstName, lastName, phoneNumber } = dto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // find token record
    const record = await this.prisma.verificationCode.findFirst({
      where: { email, code },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // delete token to prevent reuse
    await this.prisma.verificationCode.delete({ where: { id: record.id } });

    // create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        phoneNumber,
        role: Role.USER,
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

    // Generate JWT token
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Create refresh token
    const refreshToken = await this.createRefreshToken(
      user.id,
      this.getIpAddress(),
      this.getUserAgent(),
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      user,
    };
  }

  async resendVerificationCode(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const code = await this.generateAndStoreCode(email);
    await this.mailerService.sendVerificationEmail(email, code);

    return { message: 'Verification code sent to email. It will expire in 5 minutes.' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { currentPassword, newPassword } = changePasswordDto;

    // Verify current password is correct
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    const { email, password, firstName, lastName } = createAdminDto;

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        role: Role.ADMIN,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'Admin created successfully',
      user,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('If the email is registered, a reset code will be sent');
    }

    const code = await this.generateAndStoreCode(email);
    await this.mailerService.sendForgotPasswordEmail(email, code);

    return { message: 'If the email is registered, a reset code has been sent' };
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }

    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: { email, code },
    });

    if (!verificationCode || verificationCode.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Delete the code to prevent reuse
    await this.prisma.verificationCode.delete({ where: { id: verificationCode.id } });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return { message: 'Password reset successfully' };
  }
}
