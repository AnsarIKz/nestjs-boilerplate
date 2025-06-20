import { Booking, Restaurant, User } from '@prisma/client';

export type UserSummary = Pick<User, 'id' | 'firstName' | 'lastName' | 'phoneNumber' | 'email'>;

export type BookingWithRelations = Booking & {
  restaurant: Restaurant;
  user: UserSummary;
};

export type BookingWithRestaurantSummary = Booking & {
  restaurant: Pick<Restaurant, 'id' | 'name' | 'address' | 'phoneNumber'>;
  user: UserSummary;
};

export type BookingWithUser = Booking & {
  user: UserSummary;
};
