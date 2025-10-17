import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';
import { ProgressModule } from '../progress';
import { WebSocketModule } from '../websocket/websocket.module';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

/**
 * Module for workout session management
 * Handles session creation, invites, turn-based progression, set recording, and avatar evolution integration
 */
@Module({
  imports: [FirebaseModule, AuthModule, ProgressModule, WebSocketModule],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [SessionsService], // Export for potential use by other modules (e.g., progress tracking in Phase 2)
})
export class SessionsModule {}
