import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService) {}

  getHeapLimitBytes(): number {
    const mb = this.config.get<number>('health.heapLimitMb', 150);
    return mb * 1024 * 1024;
  }
}
