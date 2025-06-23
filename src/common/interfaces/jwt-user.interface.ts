import { Role } from '@prisma/client';

export interface JwtUser {
  userId: string;
  phoneNumber: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  language?: string;
  currency?: string;
}

export interface RequestWithUser {
  user: JwtUser;
}
