import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expires },
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  findAll() {
    this.logger.debug('Finding all users');
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    this.logger.debug(`Finding user with ID: ${id}`);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`User with ID ${id} not found`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    this.logger.debug(`Finding user with email: ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`User with email ${email} not found`);
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.logger.debug(`Updating user with ID: ${id}`);

    // Ensure id is provided
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    // Check if user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Remove undefined values from update data
    const updateData = Object.fromEntries(
      Object.entries(updateUserDto).filter(([_, value]) => value !== undefined),
    );

    // Ensure email cannot be updated
    if ('email' in updateData) {
      delete updateData.email;
      this.logger.warn('Attempted to update email - this field cannot be changed');
    }

    // Check if phone number is being updated and if it's already taken
    if (updateData.phoneNumber) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phoneNumber: updateData.phoneNumber },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Phone number already in use');
      }
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          profileImageUrl: true,
          language: true,
          currency: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user with ID ${id}: ${error.message}`);

      // Return more specific error message
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Unique constraint violation: ${error.meta?.target?.[0] || 'field'} already in use`,
        );
      }

      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }
  }

  async delete(id: string) {
    this.logger.debug(`Deleting user with ID: ${id}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete user with ID ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete user');
    }
  }

  async deleteByEmail(email: string) {
    this.logger.debug(`Deleting user with email: ${email}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      await this.prisma.user.delete({
        where: { email },
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete user with email ${email}: ${error.message}`);
      throw new BadRequestException('Failed to delete user');
    }
  }
}
