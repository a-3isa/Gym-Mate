import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { API_PREFIX } from './app.constants';
import { ConfiguredSocketIoAdapter } from './websocket/configured-socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown hooks for proper cleanup of Firebase connections and WebSocket connections
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix(API_PREFIX);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv');
  const allowedOrigins = configService.get<string>('cors.allowedOrigins');

  if (allowedOrigins) {
    const origins = allowedOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const allowsAnyOrigin = origins.length === 0 || origins.includes('*');

    if (allowsAnyOrigin) {
      app.enableCors({ origin: '*', credentials: false });
    } else {
      app.enableCors({ origin: origins, credentials: true });
    }
  } else if (nodeEnv === 'production') {
    // Restrict CORS in production by default
    app.enableCors({ origin: false, credentials: false });
  } else {
    app.enableCors({ origin: true, credentials: true });
  }

  app.useWebSocketAdapter(new ConfiguredSocketIoAdapter(app));

  const port = configService.get<number>('port') ?? 3000;
  const host = configService.get<string>('host') ?? '0.0.0.0';
  await app.listen(port, host);

  Logger.log(`Application is running on: http://${host}:${port}`, 'Bootstrap');
}
bootstrap().catch((error) => {
  Logger.error(
    `Failed to bootstrap application: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
