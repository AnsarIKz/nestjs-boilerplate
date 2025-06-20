import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RequestWithUser } from '../../common/interfaces/jwt-user.interface';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: RequestWithUser) {
    return this.bookingsService.create(createBookingDto, req.user.userId);
  }

  @Get()
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
  getBookingsByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Query('date') date?: string,
  ) {
    return this.bookingsService.getBookingsByRestaurant(restaurantId, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    // Админы могут видеть любое бронирование
    if (req.user.role === 'ADMIN') {
      return this.bookingsService.findOne(id);
    }
    // Обычные пользователи видят только свои
    return this.bookingsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
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
  cancel(@Param('id') id: string, @Req() req: RequestWithUser) {
    // Админы могут отменить любое бронирование
    if (req.user.role === 'ADMIN') {
      return this.bookingsService.cancel(id);
    }
    // Обычные пользователи могут отменить только свои
    return this.bookingsService.cancel(id, req.user.userId);
  }
}
