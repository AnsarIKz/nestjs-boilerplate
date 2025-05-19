import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  Put,
  Request,
  BadRequestException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Return all users',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  findAll() {
    this.logger.log('Finding all users');
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the user',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string', enum: ['USER', 'ADMIN'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Finding user with ID: ${id}`);
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data',
    examples: {
      example1: {
        value: {
          firstName: 'New First Name',
          lastName: 'New Last Name',
          phoneNumber: '+1234567890',
          profileImageUrl: 'https://example.com/image.jpg',
          language: 'en',
          currency: 'KZT',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phoneNumber: { type: 'string' },
        profileImageUrl: { type: 'string' },
        language: { type: 'string' },
        currency: { type: 'string' },
        role: { type: 'string', enum: ['USER', 'ADMIN'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email or phone number already in use' })
  async updateSelf(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    try {
      this.logger.log(`Updating user with ID from token: ${req.user.userId}`);
      return await this.usersService.update(req.user.userId, updateUserDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':type/:identifier')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user by ID or email (Admin only)' })
  @ApiParam({
    name: 'type',
    description: 'Type of identifier (id or email)',
    enum: ['id', 'email'],
    example: 'id',
  })
  @ApiParam({
    name: 'identifier',
    description: 'User ID or email value',
    example: 'user@rama.gg',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User deleted successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid identifier type' })
  async delete(@Param('type') type: 'id' | 'email', @Param('identifier') identifier: string) {
    this.logger.log(`Deleting user with ${type}: ${identifier}`);

    if (type === 'email') {
      return this.usersService.deleteByEmail(identifier);
    }

    if (type === 'id') {
      return this.usersService.delete(identifier);
    }

    throw new BadRequestException('Invalid identifier type. Must be either "id" or "email"');
  }
}
