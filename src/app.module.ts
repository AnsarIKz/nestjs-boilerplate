import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { I18nModule } from 'nestjs-i18n';
import { CommonModule } from './common/common.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from './mailer/mailer.module';
import { UsersModule } from './users/users.module';
import { CookieResolver, HeaderResolver, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Logger
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logConfig = configService.get('logging');
        return {
          pinoHttp: {
            level: logConfig.level,
            transport: logConfig.pretty ? { target: 'pino-pretty' } : undefined,
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
          throttlers: [
            {
              name: 'default',
              ttl: securityConfig?.rateLimitTtl || 60000,
              limit: securityConfig?.rateLimitLimit || 100,
            },
          ],
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
