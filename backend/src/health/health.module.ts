import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { FirestoreService } from '../firebase/services';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthService, FirestoreService],
})
export class HealthModule {}
