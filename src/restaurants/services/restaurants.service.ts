import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Restaurant, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantDto } from '../dto/create-restaurant.dto';
import { UpdateRestaurantDto } from '../dto/update-restaurant.dto';
import { SearchRestaurantsDto } from '../dto/search-restaurants.dto';
import { AdvancedSearchDto } from '../dto/advanced-search.dto';
import { RestaurantWithBookings } from '../../common/types/restaurant.types';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data: createRestaurantDto,
    });
  }

  async findAll(searchDto?: SearchRestaurantsDto) {
    const {
      page = 1,
      limit = 10,
      cuisine,
      priceRange,
      minRating,
      search,
      features,
    } = searchDto || {};

    const skip = (page - 1) * limit;

    const where: Prisma.RestaurantWhereInput = {
      isActive: true,
      ...(cuisine && { cuisine: { has: cuisine } }),
      ...(priceRange && { priceRange }),
      ...(minRating && { rating: { gte: minRating } }),
      ...(features &&
        features.length > 0 && {
          features: { hasEvery: features },
        }),
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
        orderBy: [{ rating: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: {
        restaurants,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      statusCode: 200,
      message: 'Success',
    };
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

  async getTopFeatures() {
    // Get all restaurants with their features
    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      select: { features: true },
    });

    // Count features
    const featureCount = new Map<string, number>();

    restaurants.forEach((restaurant) => {
      restaurant.features.forEach((feature) => {
        const currentCount = featureCount.get(feature) || 0;
        featureCount.set(feature, currentCount + 1);
      });
    });

    // Convert to array and sort by count
    const sortedFeatures = Array.from(featureCount.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    return {
      data: sortedFeatures,
      statusCode: 200,
      message: 'Success',
    };
  }

  async getCuisineTypes() {
    try {
      const { CuisineType } = await import('@prisma/client');
      const cuisineTypes = Object.values(CuisineType);

      return {
        data: cuisineTypes,
        statusCode: 200,
        message: 'Success',
      };
    } catch (error) {
      throw new InternalServerErrorException('Ошибка при получении типов кухни');
    }
  }

  async advancedSearch(searchDto: AdvancedSearchDto) {
    const {
      page = 1,
      limit = 10,
      name,
      description,
      address,
      query,
      cuisine,
      cuisines,
      priceRange,
      minRating,
      maxRating,
      minCapacity,
      maxCapacity,
      requiredFeatures,
      optionalFeatures,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = searchDto;

    const skip = (page - 1) * limit;

    // Build where conditions step by step
    const where: any = { isActive: true };
    const andConditions: any[] = [];

    // Text search
    if (name) {
      andConditions.push({ name: { contains: name, mode: 'insensitive' } });
    }
    if (description) {
      andConditions.push({ description: { contains: description, mode: 'insensitive' } });
    }
    if (address) {
      andConditions.push({ address: { contains: address, mode: 'insensitive' } });
    }
    if (query) {
      andConditions.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Cuisine filters
    if (cuisine) {
      where.cuisine = { has: cuisine };
    }
    if (cuisines && cuisines.length > 0) {
      where.cuisine = { hasSome: cuisines };
    }

    // Price range
    if (priceRange) {
      where.priceRange = priceRange;
    }

    // Rating range
    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) where.rating.gte = minRating;
      if (maxRating !== undefined) where.rating.lte = maxRating;
    }

    // Capacity range
    if (minCapacity !== undefined || maxCapacity !== undefined) {
      where.capacity = {};
      if (minCapacity !== undefined) where.capacity.gte = minCapacity;
      if (maxCapacity !== undefined) where.capacity.lte = maxCapacity;
    }

    // Features
    if (requiredFeatures && requiredFeatures.length > 0) {
      where.features = { hasEvery: requiredFeatures };
    }
    if (optionalFeatures && optionalFeatures.length > 0) {
      if (where.features) {
        andConditions.push({ features: { hasSome: optionalFeatures } });
      } else {
        where.features = { hasSome: optionalFeatures };
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Sorting
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: {
        restaurants,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      statusCode: 200,
      message: 'Success',
    };
  }
}
