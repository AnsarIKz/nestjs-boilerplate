import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminService } from '../services/admin.service';

@ApiTags('Admin')
@Controller('admin-api')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @ApiOperation({ summary: 'Проверка работоспособности админ панели' })
  @ApiResponse({ status: 200, description: 'Админ панель работает' })
  getHealth() {
    return {
      data: { status: 'healthy', timestamp: new Date().toISOString() },
      statusCode: 200,
      message: 'Admin panel is healthy',
    };
  }

  @Get('dashboard/stats')
  @Roles('ADMIN', 'RESTAURANT_OWNER')
  @ApiOperation({ summary: 'Получить статистику для дашборда' })
  @ApiResponse({
    status: 200,
    description: 'Статистика успешно получена',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number', example: 150 },
            totalRestaurants: { type: 'number', example: 25 },
            totalBookings: { type: 'number', example: 380 },
            totalBills: { type: 'number', example: 290 },
            pendingBookings: { type: 'number', example: 12 },
            unpaidBills: { type: 'number', example: 8 },
          },
        },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Dashboard stats retrieved successfully' },
      },
    },
  })
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return {
      data: stats,
      statusCode: 200,
      message: 'Dashboard stats retrieved successfully',
    };
  }
}
