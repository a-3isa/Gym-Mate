import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthService } from './health.service';

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
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.healthCheckService.check([
      () =>
        this.memoryHealthIndicator.checkHeap('memory_heap', this.healthService.getHeapLimitBytes()),
      // Firebase health check - verifies Firestore connectivity
      async () => {
        try {
          return await this.healthService.checkFirestore();
        } catch (error) {
          // Return unhealthy status if Firebase check fails
          return {
            firestore: {
              status: 'down',
              error: 'Firebase health check failed',
            },
          };
        }
      },
    ]);
  }
}
