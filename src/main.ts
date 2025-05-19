import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from '@fastify/compress';
import * as helmet from '@fastify/helmet';
import * as cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { FastifyInstance } from 'fastify';
import * as yaml from 'js-yaml';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder as SwaggerDocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create Fastify-based NestJS application
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
    { bufferLogs: true }
  );

  // Get application configuration
  const configService = app.get(ConfigService);
  const appConfig = configService.getAppConfig();
  logger.log(`Application configuration: ${JSON.stringify(appConfig)}`);
  const port = appConfig.port;
  const host = appConfig.host;
  const apiPrefix = appConfig.apiPrefix;
  const swaggerConfig = configService.getSwaggerConfig();
  const corsOrigins = configService.get<string[]>('security.corsOrigins');

  // Use Pino Logger
  app.useLogger(app.get(PinoLogger));

  app.setGlobalPrefix(apiPrefix as string, {
    exclude: swaggerConfig?.path
      ? [swaggerConfig.path, 'openapi.json', 'openapi.yaml']
      : ['openapi.json', 'openapi.yaml'],
  });

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
  await app.register(compression);
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
  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  // Register multipart plugin for file uploads with configuration from storage settings
  const fastifyInstance = app.getHttpAdapter().getInstance() as unknown as FastifyInstance;
  await fastifyInstance.register(fastifyMultipart as any, {
    limits: {
      fileSize: configService.getStorageConfig().maxFileSize,
      files: 1,
    },
    attachFieldsToBody: false,
  });

  // Setup Swagger API documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new SwaggerDocumentBuilder()
      .setTitle(swaggerConfig?.title || 'API Documentation')
      .setDescription(swaggerConfig?.description || 'API Documentation Description')
      .setVersion(swaggerConfig?.version || '1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerConfig?.path || 'apidoc', app, document);

    // Add YAML format OpenAPI document endpoint
    fastifyInstance.get('/openapi.yaml', (_, reply) => {
      reply.header('Content-Type', 'text/yaml');
      reply.send(yaml.dump(document));
    });

    logger.log(`Swagger documentation available at /${swaggerConfig?.path || 'apidoc'}`);
    logger.log(`OpenAPI YAML available at /openapi.yaml`);
  }

  // Start the application
  await app.listen(port ?? 7009, host ?? 'localhost');
  const appUrl = await app.getUrl();

  console.log('📄 Loaded .env from:', path.resolve(process.cwd(), '.env'));

  logger.log(`Application is running on: ${appUrl}`);

  if (process.env.NODE_ENV !== 'production') {
    const swaggerPath = swaggerConfig?.path || 'apidoc';
    logger.log(`Swagger API documentation available at: ${appUrl}/${swaggerPath}`);
    logger.log(`OpenAPI JSON available at: ${appUrl}/openapi.json`);
    logger.log(`OpenAPI YAML available at: ${appUrl}/openapi.yaml`);
  }
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error(`Failed to start application: ${err.message}`, err.stack);
  process.exit(1);
});
