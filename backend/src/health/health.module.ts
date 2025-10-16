import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { FirestoreHealthIndicator } from './firestore.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthService, FirestoreHealthIndicator],
})
export class HealthModule {}
