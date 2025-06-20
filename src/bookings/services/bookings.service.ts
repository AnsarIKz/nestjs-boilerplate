import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RestaurantsService } from '../../restaurants/services/restaurants.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import {
  BookingWithRelations,
  BookingWithRestaurantSummary,
  BookingWithUser,
} from '../../common/types/booking.types';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private restaurantsService: RestaurantsService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string): Promise<BookingWithRelations> {
    // Проверяем, что ресторан существует
    await this.restaurantsService.findOne(createBookingDto.restaurantId);

    // Проверяем доступность времени
    const availableSlots = await this.restaurantsService.getAvailableTimeSlots(
      createBookingDto.restaurantId,
      new Date(createBookingDto.bookingDate),
    );

    if (!availableSlots.includes(createBookingDto.bookingTime)) {
      throw new BadRequestException('Selected time slot is not available');
    }

    return this.prisma.booking.create({
      data: {
        ...createBookingDto,
        userId,
        bookingDate: new Date(createBookingDto.bookingDate),
      },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userId?: string): Promise<BookingWithRestaurantSummary[]> {
    return this.prisma.booking.findMany({
      where: userId ? { userId } : {},
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phoneNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: { bookingDate: 'desc' },
    });
  }

  async findOne(id: string, userId?: string): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Если указан userId, проверяем, что бронирование принадлежит пользователю
    if (userId && booking.userId !== userId) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId?: string,
  ): Promise<BookingWithRelations> {
    const booking = await this.findOne(id, userId);

    // Если изменяется дата или время, проверяем доступность
    if (updateBookingDto.bookingDate || updateBookingDto.bookingTime) {
      const newDate = updateBookingDto.bookingDate
        ? new Date(updateBookingDto.bookingDate)
        : booking.bookingDate;
      const newTime = updateBookingDto.bookingTime || booking.bookingTime;

      const availableSlots = await this.restaurantsService.getAvailableTimeSlots(
        booking.restaurantId,
        newDate,
      );

      if (!availableSlots.includes(newTime)) {
        throw new BadRequestException('Selected time slot is not available');
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...updateBookingDto,
        ...(updateBookingDto.bookingDate && {
          bookingDate: new Date(updateBookingDto.bookingDate),
        }),
      },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });
  }

  async cancel(id: string, userId?: string): Promise<BookingWithRelations> {
    await this.findOne(id, userId);

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });
  }

  async getBookingsByRestaurant(restaurantId: string, date?: string): Promise<BookingWithUser[]> {
    const whereClause: Prisma.BookingWhereInput = { restaurantId };

    if (date) {
      const targetDate = new Date(date);
      whereClause.bookingDate = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    }

    return this.prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'asc' }, { bookingTime: 'asc' }],
    });
  }
}
