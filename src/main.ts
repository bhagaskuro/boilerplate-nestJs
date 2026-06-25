import { ValidationPipe, VersioningType, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Get configurations
  const swaggerEnabled = configService.get<boolean>('swagger.enabled');
  const corsOrigin = configService.get<string>('app.corsOrigin');
  const swaggerPath = configService.get<string>('swagger.path');
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const port = configService.get<number>('app.port');

  // Enable CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Class serializer for excluding fields (like password)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger Documentation
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Kuli Digital Standard API')
      .setDescription('Kuli Digital NestJS Backend API Documentation')
      .setVersion('1.0')
      .addTag('Authentication', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      useGlobalPrefix: true,
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: -1,
      },
    });
  }

  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}/`);
  console.log(`🌍 Environment: ${configService.get<string>('app.env')}\n`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger Documentaion on : http://localhost:${port}/api/${swaggerPath}`);
  }
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🏓 Ping endpoint: http://localhost:${port}/ping\n`);
}

bootstrap();
