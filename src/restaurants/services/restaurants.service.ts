import { Injectable, NotFoundException } from '@nestjs/common';
import { Restaurant, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantDto } from '../dto/create-restaurant.dto';
import { UpdateRestaurantDto } from '../dto/update-restaurant.dto';
import { SearchRestaurantsDto } from '../dto/search-restaurants.dto';
import { RestaurantWithBookings } from '../../common/types/restaurant.types';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data: createRestaurantDto,
    });
  }

  async findAll(
    searchDto?: SearchRestaurantsDto,
  ): Promise<{ restaurants: Restaurant[]; total: number }> {
    const { page = 1, limit = 10, cuisine, priceRange, minRating, search } = searchDto || {};

    const skip = (page - 1) * limit;

    const where: Prisma.RestaurantWhereInput = {
      isActive: true,
      ...(cuisine && { cuisine: { has: cuisine } }),
      ...(priceRange && { priceRange }),
      ...(minRating && { rating: { gte: minRating } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return { restaurants, total };
  }

  async findOne(id: string): Promise<RestaurantWithBookings> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            bookingDate: { gte: new Date() },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          orderBy: { bookingDate: 'asc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async update(id: string, updateRestaurantDto: UpdateRestaurantDto): Promise<Restaurant> {
    await this.findOne(id); // Check if exists

    return this.prisma.restaurant.update({
      where: { id },
      data: updateRestaurantDto,
    });
  }

  async remove(id: string): Promise<Restaurant> {
    await this.findOne(id); // Check if exists

    return this.prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAvailableTimeSlots(restaurantId: string, date: Date): Promise<string[]> {
    const restaurant = await this.findOne(restaurantId);

    // Get all bookings for the date
    const bookings = await this.prisma.booking.findMany({
      where: {
        restaurantId,
        bookingDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    // Calculate occupied slots
    const occupiedSlots = new Map<string, number>();
    bookings.forEach((booking) => {
      const time = booking.bookingTime;
      const currentGuests = occupiedSlots.get(time) || 0;
      occupiedSlots.set(time, currentGuests + booking.guestCount);
    });

    // Generate available time slots (example: 10:00 - 22:00, every 30 minutes)
    const timeSlots: string[] = [];
    for (let hour = 10; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const occupiedGuests = occupiedSlots.get(time) || 0;

        if (occupiedGuests < restaurant.capacity) {
          timeSlots.push(time);
        }
      }
    }

    return timeSlots;
  }
}
