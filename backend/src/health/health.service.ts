import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirestoreService } from '../firebase/services';
import { COLLECTIONS } from '../common/constants';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly firestoreService: FirestoreService,
  ) {}

  getHeapLimitBytes(): number {
    const mb = this.config.get<number>('health.heapLimitMb', 150);
    return mb * 1024 * 1024;
  }

  /**
   * Check Firestore connectivity
   * Performs a minimal read operation to verify Firebase is configured and reachable
   * @returns Promise with health indicator result
   */
  async checkFirestore(): Promise<{ firestore: { status: string; error?: string } }> {
    try {
      // Attempt to access the users collection with a minimal read
      const collection = this.firestoreService.getCollection(COLLECTIONS.USERS);
      // Limit to 1 document to minimize read operations
      await collection.limit(1).get();

      return {
        firestore: { status: 'up' },
      };
    } catch (error: any) {
      return {
        firestore: {
          status: 'down',
          error: error.message || 'Unable to connect to Firestore',
        },
      };
    }
  }
}
