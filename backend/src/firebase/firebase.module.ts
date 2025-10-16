import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  initializeApp,
  getApps,
  getApp,
  deleteApp,
  App,
  cert,
  applicationDefault,
} from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getAuth, Auth } from 'firebase-admin/auth';
import { FirestoreService, StorageService, AuthService } from './services';
import { FIREBASE_APP, FIRESTORE, STORAGE, AUTH } from './firebase.tokens';

/**
 * Firebase Module
 *
 * Provides singleton instances of Firebase Admin SDK services (Firestore, Storage, Auth)
 * to the rest of the application. Supports both credential-based initialization
 * and Application Default Credentials (ADC) for cloud environments.
 *
 * Also supports Firebase Emulator Suite for local development.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FIREBASE_APP,
      useFactory: (configService: ConfigService): App => {
        // Check if app already exists (prevents re-initialization)
        const apps = getApps();
        if (apps.length > 0) {
          return getApp();
        }

        // Get configuration
        const projectId = configService.get<string>('firebase.projectId');
        const clientEmail = configService.get<string>('firebase.clientEmail');
        const privateKey = configService.get<string>('firebase.privateKey');
        const storageBucket = configService.get<string>('firebase.storageBucket');

        // Get emulator configuration
        const firestoreHost = configService.get<string>('emulators.firestoreHost');
        const authHost = configService.get<string>('emulators.authHost');
        const storageHost =
          configService.get<string>('emulators.storageHost') ??
          process.env.STORAGE_EMULATOR_HOST ??
          process.env.FIREBASE_STORAGE_EMULATOR_HOST;

        // Set emulator hosts if provided
        if (firestoreHost) {
          process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
        }
        if (authHost) {
          process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
        }
        if (storageHost) {
          process.env.STORAGE_EMULATOR_HOST = storageHost.startsWith('http')
            ? storageHost
            : `http://${storageHost}`;
        }

        // Initialize Firebase Admin SDK
        let app: App;
        const usingEmulators = Boolean(firestoreHost || authHost || storageHost);

        if (projectId && clientEmail && privateKey) {
          // Credential-based initialization
          app = initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
            storageBucket,
          });
        } else if (projectId && !usingEmulators) {
          // Application Default Credentials (ADC) mode
          // Used in cloud environments where credentials are automatically provided
          app = initializeApp({
            credential: applicationDefault(),
            projectId,
            storageBucket,
          });
        } else if (usingEmulators) {
          // Emulator-only mode (no credentials needed)
          app = initializeApp({
            projectId: projectId ?? 'demo-project',
            storageBucket: storageBucket ?? `${projectId ?? 'demo-project'}.appspot.com`,
          });
        } else {
          app = initializeApp();
        }

        return app;
      },
      inject: [ConfigService],
    },
    {
      provide: FIRESTORE,
      useFactory: (app: App): Firestore => {
        return getFirestore(app);
      },
      inject: [FIREBASE_APP],
    },
    {
      provide: STORAGE,
      useFactory: (app: App): Storage => {
        return getStorage(app);
      },
      inject: [FIREBASE_APP],
    },
    {
      provide: AUTH,
      useFactory: (app: App): Auth => {
        return getAuth(app);
      },
      inject: [FIREBASE_APP],
    },
    FirestoreService,
    StorageService,
    AuthService,
  ],
  exports: [FIREBASE_APP, FIRESTORE, STORAGE, AUTH, FirestoreService, StorageService, AuthService],
})
export class FirebaseModule implements OnModuleDestroy {
  /**
   * Cleanup Firebase app on module destruction
   * Ensures graceful shutdown and resource cleanup
   */
  async onModuleDestroy() {
    const apps = getApps();
    if (apps.length > 0) {
      await Promise.all(apps.map((app) => deleteApp(app)));
    }
  }
}
