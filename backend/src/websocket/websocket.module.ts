import { Module } from '@nestjs/common';
import { SessionGateway } from './session.gateway';
import { ConfigModule } from '@nestjs/config';

/**
 * WebSocketModule
 *
 * Module that handles real-time WebSocket communication for workout sessions.
 * Provides the SessionGateway for managing collaborative workout sessions.
 */
@Module({
  imports: [ConfigModule], // Already global, but explicit for clarity
  providers: [SessionGateway],
  exports: [SessionGateway], // Export for use in other modules if needed
})
export class WebSocketModule {}
