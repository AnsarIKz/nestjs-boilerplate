import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { StaticController } from './controllers/static.controller';
import { AdminService } from './services/admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, StaticController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
