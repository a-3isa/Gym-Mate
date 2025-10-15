import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class ConfiguredSocketIoAdapter extends IoAdapter {
  constructor(private readonly appContext: INestApplicationContext) {
    super(appContext);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const configService = this.appContext.get(ConfigService);

    const configuredOrigin =
      configService.get<string>('websocket.corsOrigin') ??
      process.env.WEBSOCKET_CORS_ORIGIN ??
      configService.get<string>('cors.allowedOrigins') ??
      process.env.CORS_ALLOWED_ORIGINS ??
      '*';

    const normalizedOrigin = configuredOrigin.trim();

    const parsedOrigins = normalizedOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    const allowsAnyOrigin =
      normalizedOrigin === '*' || parsedOrigins.includes('*') || parsedOrigins.length === 0;

    const resolvedOrigin = allowsAnyOrigin
      ? '*'
      : parsedOrigins.length === 1
        ? parsedOrigins[0]
        : parsedOrigins;

    const corsOptions = {
      origin: resolvedOrigin,
      credentials: !allowsAnyOrigin,
    } as NonNullable<ServerOptions['cors']>;

    const serverOptions: ServerOptions = {
      ...options,
      cors: {
        ...(options?.cors ?? {}),
        ...corsOptions,
      },
    };

    const configuredPort = configService.get<number>('websocket.port');

    return super.createIOServer(configuredPort ?? port, serverOptions);
  }
}
