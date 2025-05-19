export const AUTH_JS_ACCOUNT_COLLECTION = 'accounts';
export const AUTH_JS_SESSION_COLLECTION = 'sessions';
export const AUTH_JS_USER_COLLECTION = 'readers';
export const AuthInstanceInjectKey = Symbol('AuthInstance');

export enum OAuthProviderType {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
}

// Auth middleware configuration
// Paths relative to the basePath that should bypass authentication
export const AUTH_BYPASS_PATHS = [
  '/better-auth/token',
  '/better-auth/session',
  '/better-auth/providers',
  '/healthcheck',
  '/apidoc',
  '/openapi.yaml',
  '/openapi.json',
];
export const AUTH_ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS'];
