import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
        ...(process.env.NODE_ENV === 'development'
          ? [{ emit: 'stdout' as const, level: 'query' as const }]
          : []),
      ],
      errorFormat: 'pretty',
    });
  }

  onModuleInit() {
    // Запускаем подключение в фоне, не блокируя инициализацию
    this.connectInBackground();
  }

  private connectInBackground() {
    this.$connect()
      .then(() => {
        this.logger.log('Successfully connected to database');
      })
      .catch((error) => {
        this.logger.error('Failed to connect to database:', error);
      });
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('Successfully disconnected from database');
    } catch (error) {
      this.logger.error('Error during database disconnection:', error);
    }
  }
}
