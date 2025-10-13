import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private memoryHealthIndicator: MemoryHealthIndicator,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () =>
        this.memoryHealthIndicator.checkHeap('memory_heap', this.healthService.getHeapLimitBytes()),
    ]);
  }
}
