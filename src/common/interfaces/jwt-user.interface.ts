import { Role } from '@prisma/client';

export interface JwtUser {
  userId: string;
  phoneNumber: string;
  role: Role;
}

export interface RequestWithUser {
  user: JwtUser;
}
