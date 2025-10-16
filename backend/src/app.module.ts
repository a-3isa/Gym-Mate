import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { FirebaseModule } from './firebase';
import { AuthModule } from './auth';
import { ExercisesModule } from './exercises';
import { SessionsModule } from './sessions';
import { WebSocketModule } from './websocket';

@Module({
  imports: [
    // ConfigModule must be first to provide configuration for other modules
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validate,
    }),
    // FirebaseModule depends on ConfigModule for credentials
    FirebaseModule,
    // AuthModule provides authentication and user profile management
    AuthModule,
    // ExercisesModule provides read-only access to the curated exercise library
    ExercisesModule,
    // SessionsModule provides collaborative workout session management with friend invites and turn-based progression
    SessionsModule,
    // Feature modules
    HealthModule,
    WebSocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
