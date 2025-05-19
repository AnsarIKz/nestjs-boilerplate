import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { I18nModule } from 'nestjs-i18n';
import { CommonModule } from './common/common.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from './mailer/mailer.module';
import { UsersModule } from './users/users.module';
import {
  CookieResolver,
  HeaderResolver,
  QueryResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import configuration, { validationSchema } from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    
    // Logger
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logConfig = configService.get('logging');
        return {
          pinoHttp: {
            level: logConfig.level,
            transport: logConfig.pretty
              ? { target: 'pino-pretty' }
              : undefined,
          },
        };
      },
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const securityConfig = configService.get('security');
        return {
          ttl: securityConfig.rateLimitTtl,
          limit: securityConfig.rateLimitLimit,
        };
      },
    }),
    
    // Database
    PrismaModule,
    
    // Feature modules
    AuthModule,
    UsersModule,
    
    // I18n
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang', 'l']),
        new HeaderResolver(['x-custom-lang']),
        new CookieResolver(['lang']),
        AcceptLanguageResolver,
      ],
    }),
    
    CommonModule,
    StorageModule.register(),
    MailerModule,
  ],
  controllers: [],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
