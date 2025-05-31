import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@app/config/config.service';

@Injectable()
export class LoggerService extends Logger {
  constructor(private readonly config: ConfigService) {
    super('Application');
  }

  log(message: string, context?: string): void {
    super.log(message, context || 'Application');
  }

  error(message: string, trace?: string, context?: string): void {
    super.error(message, trace, context || 'Application');
  }

  warn(message: string, context?: string): void {
    super.warn(message, context || 'Application');
  }

  debug(message: string, context?: string): void {
    super.debug(message, context || 'Application');
  }

  verbose(message: string, context?: string): void {
    super.verbose(message, context || 'Application');
  }
}
