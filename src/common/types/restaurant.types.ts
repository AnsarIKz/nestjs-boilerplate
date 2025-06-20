import { Restaurant, Booking } from '@prisma/client';

export type RestaurantWithBookings = Restaurant & {
  bookings: Booking[];
};

export type RestaurantSummary = Pick<Restaurant, 'id' | 'name' | 'address' | 'phoneNumber'>;
