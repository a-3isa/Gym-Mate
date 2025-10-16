import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { FirestoreService } from '../firebase/services/firestore.service';
import { COLLECTIONS } from 'src/common/constants';

@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  constructor(private readonly firestore: FirestoreService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const col = this.firestore.getCollection(COLLECTIONS.USERS);
      await col.limit(1).get();
      return this.getStatus(key, true);
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      return this.getStatus(key, false, { error: message });
    }
  }
}
