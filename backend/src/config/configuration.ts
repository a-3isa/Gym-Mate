const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export default () => ({
  port: parseNumber(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  health: {
    heapLimitMb: parseNumber(process.env.HEALTH_HEAP_LIMIT_MB, 150),
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (() => {
      const rawKey = process.env.FIREBASE_PRIVATE_KEY;
      const cleaned = rawKey?.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
      return cleaned;
    })(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  },
  emulators: {
    firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
    authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    storageHost: process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  },
  websocket: {
    corsOrigin: process.env.WEBSOCKET_CORS_ORIGIN || process.env.CORS_ALLOWED_ORIGINS || '*',
    port: process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT, 10) : undefined,
  },
  // database: {
  //   url: process.env.DATABASE_URL,
  // },
  // jwt: {
  //   secret: process.env.JWT_SECRET,
  // },
});
