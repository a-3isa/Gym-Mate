import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';

export class ConfiguredSocketIoAdapter extends IoAdapter {
  private readonly configService: ConfigService;

  constructor(app: INestApplicationContext) {
    super(app);
    this.configService = app.get(ConfigService);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const corsOrigin = this.configService.get<string>('websocket.corsOrigin') || '*';
    const wsPort = this.configService.get<number>('websocket.port') ?? port;

    const resolvedOrigins =
      corsOrigin === '*'
        ? '*'
        : corsOrigin
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);

    const isWildcardOrigin = resolvedOrigins === '*';

    const server = super.createIOServer(wsPort, {
      ...options,
      cors: {
        origin: resolvedOrigins,
        credentials: !isWildcardOrigin,
      },
    }) as Server;

    return server;
  }
}
