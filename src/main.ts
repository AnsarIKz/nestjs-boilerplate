import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { FastifyInstance } from 'fastify';
import * as yaml from 'js-yaml';
import * as compression from '@fastify/compress';
import * as helmet from '@fastify/helmet';
import * as cors from '@fastify/cors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('Starting application bootstrap...');

    // Create Fastify-based NestJS application
    logger.log('Creating NestJS application...');
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({ logger: false }),
    );

    logger.log('NestJS application created successfully');

    // Get application configuration
    logger.log('Getting configuration service...');
    const configService = app.get(ConfigService);
    const appConfig = configService.getAppConfig();
    const port = appConfig.port;
    const host = appConfig.host;
    const apiPrefix = appConfig.apiPrefix;
    const swaggerConfig = configService.getSwaggerConfig();
    const corsConfig = configService.get('cors');

    // Set API prefix
    app.setGlobalPrefix(apiPrefix as string, {
      exclude: swaggerConfig?.path
        ? [swaggerConfig.path, 'openapi.json', 'openapi.yaml']
        : ['openapi.json', 'openapi.yaml'],
    });

    // Enable versioning
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // Setup global request validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(
      new I18nValidationExceptionFilter({
        detailedErrors: false,
      }),
    );

    // Register Fastify plugins
    logger.log('Registering Fastify plugins...');

    await app.register(compression);
    logger.log('✓ Compression plugin registered');

    await app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    });
    logger.log('✓ Helmet security plugin registered');

    await app.register(cors, {
      origin: corsConfig?.origin || '*',
      credentials: corsConfig?.credentials || true,
    });
    logger.log('✓ CORS plugin registered');

    // Setup Swagger API documentation
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle(swaggerConfig?.title || 'API Documentation')
        .setDescription(swaggerConfig?.description || 'API Documentation Description')
        .setVersion(swaggerConfig?.version || '1.0.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(swaggerConfig?.path || 'apidoc', app, document);

      // Add YAML format OpenAPI document endpoint
      const fastifyInstance = app.getHttpAdapter().getInstance() as unknown as FastifyInstance;
      fastifyInstance.get('/openapi.yaml', (_, reply) => {
        reply.header('Content-Type', 'text/yaml');
        reply.send(yaml.dump(document));
      });

      logger.log(`✓ Swagger documentation registered at /${swaggerConfig?.path || 'apidoc'}`);
    }

    // Start the application
    await app.listen(port ?? 7009, host ?? 'localhost');
    const appUrl = await app.getUrl();

    logger.log(`🚀 Application is running on: ${appUrl}`);
    logger.log(`📡 API available at: ${appUrl}/${apiPrefix}`);

    if (process.env.NODE_ENV !== 'production') {
      const swaggerPath = swaggerConfig?.path || 'apidoc';
      logger.log(`📚 Swagger API documentation: ${appUrl}/${swaggerPath}`);
    }
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error(`Failed to start application: ${err.message}`, err.stack);
  process.exit(1);
});
