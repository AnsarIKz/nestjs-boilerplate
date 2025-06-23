import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalRestaurants, totalBookings, totalBills, pendingBookings, unpaidBills] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.restaurant.count(),
        this.prisma.booking.count(),
        this.prisma.bill.count(),
        this.prisma.booking.count({ where: { status: 'PENDING' } }),
        this.prisma.bill.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      totalUsers,
      totalRestaurants,
      totalBookings,
      totalBills,
      pendingBookings,
      unpaidBills,
    };
  }
}
