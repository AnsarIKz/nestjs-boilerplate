export default {
  app: {
    name: process.env.APP_NAME || 'Nest JS Project Template',
    description: process.env.APP_DESCRIPTION || 'NestJS template with best practices',
    version: process.env.API_VERSION || '1.0',
    port: parseInt(process.env.PORT || '7009', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || 'api',
  },
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/nestjs_practice',
  },
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '90d',
    },
  },
  cors: {
    enabled: true,
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
  swagger: {
    enabled: true,
    title: 'NestJS Project Template API',
    description: 'NestJS Project Template API documentation',
    version: process.env.API_DOC_VERSION || '1.0.0',
    path: 'apidoc',
    openApiVersion: process.env.OPEN_API_VERSION || '3.1.0',
  },
  security: {
    helmet: true,
    rateLimit: true,
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3',
    bucket: process.env.STORAGE_BUCKET || 'my-bucket',
    region: process.env.STORAGE_REGION || 'us-east-1',
    endpoint: process.env.STORAGE_ENDPOINT || 's3.amazonaws.com',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    accessKeySecret: process.env.STORAGE_ACCESS_KEY_SECRET,
    baseUrl: process.env.STORAGE_BASE_URL || '',
    maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '10485760', 10), // Default 10MB
    allowedMimeTypes: (
      process.env.STORAGE_ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf'
    ).split(','),
  },
  datadog: {
    apiKey: process.env.DATADOG_API_KEY,
    serviceName: process.env.DATADOG_SERVICE_NAME || 'my-service',
    hostName: process.env.DATADOG_HOST_NAME || 'host-name',
    intakeRegion: process.env.DATADOG_INTAKE_REGION || 'us5',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: process.env.STRIPE_API_VERSION || '2025-02-24.acacia',
  },
  oauth: {
    providers: [
      ...(process.env.OAUTH_PROVIDERS || 'github').split(',').map((type) => ({
        type: type.trim(),
        enabled: true,
      })),
    ],
    // Core OAuth settings
    baseConfig: {
      callbackUrl:
        process.env.OAUTH_CALLBACK_URL_BASE || 'http://localhost:7009/api/v1/auth/callback',
      cookieName: process.env.OAUTH_COOKIE_NAME || 'auth_session',
      cookieMaxAge: parseInt(process.env.OAUTH_COOKIE_MAX_AGE || '2592000', 10), // 30 days
      cookieSecure: process.env.OAUTH_COOKIE_SECURE === 'true',
    },
    // Provider configurations
    secrets: {
      // Default demo example provider
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID || '',
        clientSecret: process.env.APPLE_CLIENT_SECRET || '',
      },
      // more providers can be added here
    },
  },
};
