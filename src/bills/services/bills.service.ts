import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBillDto, BillItemDto } from '../dto/create-bill.dto';
import { UpdateBillDto } from '../dto/update-bill.dto';
import { SearchBillsDto } from '../dto/search-bills.dto';
import { Bill, BillStatus, PaymentMethod, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async create(createBillDto: CreateBillDto): Promise<any> {
    try {
      // Verify restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: createBillDto.restaurantId, isActive: true },
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found or inactive');
      }

      // Verify booking exists if bookingId provided
      if (createBillDto.bookingId) {
        const booking = await this.prisma.booking.findUnique({
          where: { id: createBillDto.bookingId, restaurantId: createBillDto.restaurantId },
        });

        if (!booking) {
          throw new NotFoundException('Booking not found for this restaurant');
        }
      }

      // Calculate financial data
      const subtotal = this.calculateSubtotal(createBillDto.items);
      const discountAmount = createBillDto.discountPercent
        ? subtotal * (createBillDto.discountPercent / 100)
        : 0;

      const discountedAmount = subtotal - discountAmount;
      const taxAmount = createBillDto.taxPercent
        ? discountedAmount * (createBillDto.taxPercent / 100)
        : 0;

      const serviceCharge = createBillDto.serviceCharge || 0;
      const totalAmount = discountedAmount + taxAmount + serviceCharge;

      // Generate bill number
      const billNumber = await this.generateBillNumber();

      // Generate items text description
      const itemsText = this.generateItemsText(createBillDto.items);

      const bill = await this.prisma.bill.create({
        data: {
          billNumber,
          restaurantId: createBillDto.restaurantId,
          bookingId: createBillDto.bookingId,
          customerName: createBillDto.customerName,
          customerPhone: createBillDto.customerPhone,
          customerEmail: createBillDto.customerEmail,
          items: JSON.parse(JSON.stringify(createBillDto.items)),
          itemsText,
          subtotal: new Decimal(subtotal),
          discountAmount: new Decimal(discountAmount),
          discountPercent: createBillDto.discountPercent,
          taxAmount: new Decimal(taxAmount),
          taxPercent: createBillDto.taxPercent,
          serviceCharge: new Decimal(serviceCharge),
          totalAmount: new Decimal(totalAmount),
          paymentMethod: createBillDto.paymentMethod,
          notes: createBillDto.notes,
          externalId: createBillDto.externalId,
          externalData: createBillDto.externalData,
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
            },
          },
          booking: {
            select: {
              id: true,
              bookingDate: true,
              bookingTime: true,
              guestCount: true,
            },
          },
        },
      });

      return {
        data: bill,
        statusCode: 201,
        message: 'Bill created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create bill');
    }
  }

  async findAll(searchDto: SearchBillsDto): Promise<any> {
    try {
      const { page = 1, limit = 10, ...filters } = searchDto;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Apply filters
      if (filters.restaurantId) {
        where.restaurantId = filters.restaurantId;
      }

      if (filters.bookingId) {
        where.bookingId = filters.bookingId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
      }

      if (filters.billNumber) {
        where.billNumber = { contains: filters.billNumber, mode: 'insensitive' };
      }

      if (filters.customerName) {
        where.customerName = { contains: filters.customerName, mode: 'insensitive' };
      }

      if (filters.customerPhone) {
        where.customerPhone = { contains: filters.customerPhone };
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
        }
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.totalAmount = {};
        if (filters.minAmount !== undefined) {
          where.totalAmount.gte = new Decimal(filters.minAmount);
        }
        if (filters.maxAmount !== undefined) {
          where.totalAmount.lte = new Decimal(filters.maxAmount);
        }
      }

      const [bills, total] = await Promise.all([
        this.prisma.bill.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                address: true,
                phoneNumber: true,
              },
            },
            booking: {
              select: {
                id: true,
                bookingDate: true,
                bookingTime: true,
                guestCount: true,
              },
            },
          },
        }),
        this.prisma.bill.count({ where }),
      ]);

      return {
        data: {
          bills,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        statusCode: 200,
        message: 'Bills retrieved successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve bills');
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const bill = await this.prisma.bill.findUnique({
        where: { id },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
              email: true,
            },
          },
          booking: {
            select: {
              id: true,
              bookingDate: true,
              bookingTime: true,
              guestCount: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
      });

      if (!bill) {
        throw new NotFoundException(`Bill with ID ${id} not found`);
      }

      return {
        data: bill,
        statusCode: 200,
        message: 'Bill retrieved successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve bill');
    }
  }

  async update(id: string, updateBillDto: UpdateBillDto): Promise<any> {
    try {
      await this.findOne(id); // Check if exists

      const updateData: Record<string, unknown> = {};

      // Copy basic fields
      if (updateBillDto.customerName) updateData.customerName = updateBillDto.customerName;
      if (updateBillDto.customerPhone) updateData.customerPhone = updateBillDto.customerPhone;
      if (updateBillDto.customerEmail) updateData.customerEmail = updateBillDto.customerEmail;
      if (updateBillDto.discountPercent !== undefined)
        updateData.discountPercent = updateBillDto.discountPercent;
      if (updateBillDto.taxPercent !== undefined) updateData.taxPercent = updateBillDto.taxPercent;
      if (updateBillDto.serviceCharge !== undefined)
        updateData.serviceCharge = new Decimal(updateBillDto.serviceCharge);
      if (updateBillDto.status) updateData.status = updateBillDto.status;
      if (updateBillDto.paymentMethod) updateData.paymentMethod = updateBillDto.paymentMethod;
      if (updateBillDto.notes) updateData.notes = updateBillDto.notes;
      if (updateBillDto.receiptUrl) updateData.receiptUrl = updateBillDto.receiptUrl;
      if (updateBillDto.externalId) updateData.externalId = updateBillDto.externalId;
      if (updateBillDto.externalData) updateData.externalData = updateBillDto.externalData;

      // If items are updated, recalculate financial data
      if (updateBillDto.items) {
        const subtotal = this.calculateSubtotal(updateBillDto.items);
        const discountAmount = updateBillDto.discountPercent
          ? subtotal * (updateBillDto.discountPercent / 100)
          : 0;

        const discountedAmount = subtotal - discountAmount;
        const taxAmount = updateBillDto.taxPercent
          ? discountedAmount * (updateBillDto.taxPercent / 100)
          : 0;

        const serviceCharge = updateBillDto.serviceCharge || 0;
        const totalAmount = discountedAmount + taxAmount + serviceCharge;

        updateData.items = JSON.parse(JSON.stringify(updateBillDto.items));
        updateData.subtotal = new Decimal(subtotal);
        updateData.discountAmount = new Decimal(discountAmount);
        updateData.taxAmount = new Decimal(taxAmount);
        updateData.serviceCharge = new Decimal(serviceCharge);
        updateData.totalAmount = new Decimal(totalAmount);
        updateData.itemsText = this.generateItemsText(updateBillDto.items);
      }

      // Set payment date when status changes to PAID
      if (updateBillDto.status === BillStatus.PAID) {
        updateData.paidAt = new Date();
      }

      const bill = await this.prisma.bill.update({
        where: { id },
        data: updateData,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
            },
          },
          booking: {
            select: {
              id: true,
              bookingDate: true,
              bookingTime: true,
              guestCount: true,
            },
          },
        },
      });

      return {
        data: bill,
        statusCode: 200,
        message: 'Bill updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update bill');
    }
  }

  async remove(id: string): Promise<any> {
    try {
      await this.findOne(id); // Check if exists

      await this.prisma.bill.delete({
        where: { id },
      });

      return {
        data: null,
        statusCode: 200,
        message: 'Bill deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete bill');
    }
  }

  async getRestaurantBills(restaurantId: string, searchDto: SearchBillsDto): Promise<any> {
    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId, isActive: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or inactive');
    }

    return this.findAll({ ...searchDto, restaurantId });
  }

  async getBillStats(restaurantId?: string): Promise<any> {
    try {
      const where: any = {};
      if (restaurantId) {
        where.restaurantId = restaurantId;
      }

      const [totalBills, paidBills, pendingBills, totalRevenue] = await Promise.all([
        this.prisma.bill.count({ where }),
        this.prisma.bill.count({ where: { ...where, status: BillStatus.PAID } }),
        this.prisma.bill.count({ where: { ...where, status: BillStatus.PENDING } }),
        this.prisma.bill.aggregate({
          where: { ...where, status: BillStatus.PAID },
          _sum: { totalAmount: true },
        }),
      ]);

      return {
        data: {
          totalBills,
          paidBills,
          pendingBills,
          cancelledBills: totalBills - paidBills - pendingBills,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
        },
        statusCode: 200,
        message: 'Bill statistics retrieved successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve bill statistics');
    }
  }

  private calculateSubtotal(items: BillItemDto[]): number {
    return items.reduce((sum, item) => sum + item.total, 0);
  }

  private generateItemsText(items: BillItemDto[]): string {
    return items
      .map((item) => {
        const notes = item.notes ? ` (${item.notes})` : '';
        return `${item.name} x${item.quantity} - ${item.total} тенге${notes}`;
      })
      .join('\n');
  }

  private async generateBillNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get the count of bills for this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    const billCount = await this.prisma.bill.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = String(billCount + 1).padStart(4, '0');
    return `BILL-${year}${month}-${sequence}`;
  }
}
