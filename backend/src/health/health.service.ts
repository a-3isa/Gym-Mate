import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHeapLimitBytes(): number {
    const heapLimitMb = this.configService.get<number>('health.heapLimitMb');
    return (heapLimitMb ?? 0) * 1024 * 1024;
  }
}
