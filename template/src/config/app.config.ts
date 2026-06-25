import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  name: process.env.APP_NAME,
  apiPrefix: process.env.API_PREFIX || 'api',

  corsOrigin: process.env.CORS_ORIGIN || '*',
}));
