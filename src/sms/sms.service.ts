import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@app/config/config.service';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const fromNumber = this.configService.get('TWILIO_FROM_NUMBER');
      const whatsappNumber = this.configService.get('TWILIO_WHATSAPP_NUMBER');

      const message = `Your verification code is: ${code}. Valid for 5 minutes.`;

      // Try WhatsApp first if configured
      if (whatsappNumber && phoneNumber.startsWith('+')) {
        try {
          const result = await this.twilioClient.messages.create({
            from: whatsappNumber,
            to: `whatsapp:${phoneNumber}`,
            body: message,
          });

          this.logger.log(`WhatsApp verification sent to ${phoneNumber}: ${result.sid}`);
          return true;
        } catch (whatsappError) {
          this.logger.warn(`WhatsApp failed for ${phoneNumber}, falling back to SMS`);
        }
      }

      // Fallback to regular SMS
      const result = await this.twilioClient.messages.create({
        from: fromNumber,
        to: phoneNumber,
        body: message,
      });

      this.logger.log(`SMS verification sent to ${phoneNumber}: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification to ${phoneNumber}:`, error);
      return false;
    }
  }

  async sendPasswordResetCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const fromNumber = this.configService.get('TWILIO_FROM_NUMBER');
      const message = `Your password reset code is: ${code}. Valid for 5 minutes.`;

      const result = await this.twilioClient.messages.create({
        from: fromNumber,
        to: phoneNumber,
        body: message,
      });

      this.logger.log(`Password reset SMS sent to ${phoneNumber}: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset to ${phoneNumber}:`, error);
      return false;
    }
  }
}
