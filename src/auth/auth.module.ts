import { DynamicModule, MiddlewareConsumer, NestModule, Provider, Module } from '@nestjs/common';
import { AuthInstance } from './auth.interface';

import { AuthInstanceInjectKey } from './auth.constant';
import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from './auth.service';
import { ConfigModule } from '@app/config/config.module';
import { ConfigService } from '@app/config/config.service';
import { PrismaModule } from '@app/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../mailer/mailer.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    MailerModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    {
      provide: AuthInstanceInjectKey,
      useFactory: () => {
        let auth: AuthInstance;
        return {
          get() {
            return auth;
          },
          set(value: AuthInstance) {
            auth = value;
          },
        };
      },
    },
  ],
  controllers: [AuthController],
})
export class AuthModule implements NestModule {
  static forRoot(): DynamicModule {
    const authProvider: Provider = {
      provide: AuthInstanceInjectKey,
      useFactory: () => {
        let auth: AuthInstance;
        return {
          get() {
            return auth;
          },
          set(value: AuthInstance) {
            auth = value;
          },
        };
      },
    };

    return {
      module: AuthModule,
      imports: [ConfigModule, PrismaModule, MailerModule],
      providers: [AuthService, authProvider],
      controllers: [AuthController],
      exports: [AuthService, authProvider],
      global: true,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        '*prefix/auth/*path',
        'auth/*path',
        'api/*prefix/auth/*path',
        '*prefix/*module/auth/*path',
        'api/*prefix/auth',
      );

    consumer.apply(AuthMiddleware).exclude();
  }
}
