import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequestWithUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать бронирование',
    description: 'Создание нового бронирования в ресторане',
  })
  @ApiResponse({ status: 201, description: 'Бронирование успешно создано' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или выбранное время недоступно' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Ресторан не найден' })
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: RequestWithUser) {
    return this.bookingsService.create(createBookingDto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список бронирований',
    description: 'Получение списка бронирований пользователя (или всех для админов)',
  })
  @ApiQuery({
    name: 'all',
    required: false,
    description: 'Получить все бронирования (только для админов)',
    example: 'true',
  })
  @ApiResponse({ status: 200, description: 'Список бронирований получен успешно' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  findAll(@Req() req: RequestWithUser, @Query('all') all?: string) {
    // Админы могут видеть все бронирования
    if (req.user.role === 'ADMIN' && all === 'true') {
      return this.bookingsService.findAll();
    }
    // Обычные пользователи видят только свои
    return this.bookingsService.findAll(req.user.userId);
  }

  @Get('restaurant/:restaurantId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RESTAURANT_OWNER')
  @ApiOperation({
    summary: 'Получить бронирования ресторана',
    description:
      'Получение списка бронирований для конкретного ресторана (только для админов и владельцев ресторанов)',
  })
  @ApiParam({
    name: 'restaurantId',
    description: 'Уникальный идентификатор ресторана',
    example: 'uuid-string',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Дата для фильтрации бронирований',
    example: '2024-12-25',
  })
  @ApiResponse({ status: 200, description: 'Список бронирований ресторана получен успешно' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  getBookingsByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('date') date?: string,
  ) {
    return this.bookingsService.getBookingsByRestaurant(restaurantId, date);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить бронирование по ID',
    description: 'Получение детальной информации о бронировании по его ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор бронирования',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 200, description: 'Информация о бронировании получена успешно' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Бронирование не найдено' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    // Админы могут видеть любое бронирование
    if (req.user.role === 'ADMIN') {
      return this.bookingsService.findOne(id);
    }
    // Обычные пользователи видят только свои
    return this.bookingsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить бронирование',
    description: 'Обновление информации о бронировании',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор бронирования',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 200, description: 'Бронирование успешно обновлено' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или выбранное время недоступно' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Бронирование не найдено' })
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Req() req: RequestWithUser,
  ) {
    // Админы могут редактировать любое бронирование
    if (req.user.role === 'ADMIN') {
      return this.bookingsService.update(id, updateBookingDto);
    }
    // Обычные пользователи могут редактировать только свои
    return this.bookingsService.update(id, updateBookingDto, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Отменить бронирование',
    description: 'Отмена бронирования (смена статуса на CANCELLED)',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор бронирования',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 200, description: 'Бронирование успешно отменено' })
  @ApiResponse({ status: 401, description: 'Неавторизован' })
  @ApiResponse({ status: 404, description: 'Бронирование не найдено' })
  cancel(@Param('id') id: string, @Req() req: RequestWithUser) {
    // Админы могут отменить любое бронирование
    if (req.user.role === 'ADMIN') {
      return this.bookingsService.cancel(id);
    }
    // Обычные пользователи могут отменить только свои
    return this.bookingsService.cancel(id, req.user.userId);
  }
}
