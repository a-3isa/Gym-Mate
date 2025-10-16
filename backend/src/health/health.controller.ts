import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthService } from './health.service';
import { FirestoreHealthIndicator } from './firestore.health';

/**
 * HealthController
 *
 * Provides health check endpoints including memory and Firebase connectivity checks
 */
@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private memoryHealthIndicator: MemoryHealthIndicator,
    private healthService: HealthService,
    private firestoreHealthIndicator: FirestoreHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.healthCheckService.check([
      () =>
        this.memoryHealthIndicator.checkHeap('memory_heap', this.healthService.getHeapLimitBytes()),
      // Firebase health check - verifies Firestore connectivity using standardized HealthIndicator
      () => this.firestoreHealthIndicator.isHealthy('firestore'),
    ]);
  }
}
