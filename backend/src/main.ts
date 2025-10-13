import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { API_PREFIX } from './app.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(API_PREFIX);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv');
  const allowedOrigins = configService.get<string>('cors.allowedOrigins');

  if (allowedOrigins) {
    const origins = allowedOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (origins.includes('*')) {
      app.enableCors({ origin: true });
    } else {
      app.enableCors({ origin: origins });
    }
  } else if (nodeEnv === 'production') {
    // Restrict CORS in production by default
    app.enableCors({ origin: false });
  } else {
    app.enableCors();
  }
  const port = configService.get<number>('port', 3000);
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
