import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config/config.module';
import { SmsService } from './sms.service';

@Module({
  imports: [ConfigModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
