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
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  },
  emulators: {
    firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
    authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    storageHost: process.env.STORAGE_EMULATOR_HOST ?? process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  },
  websocket: {
    port: parseNumber(process.env.WEBSOCKET_PORT, parseNumber(process.env.PORT, 3000)),
    corsOrigin: process.env.WEBSOCKET_CORS_ORIGIN || process.env.CORS_ALLOWED_ORIGINS || '*',
  },
  // database: {
  //   url: process.env.DATABASE_URL,
  // },
  // jwt: {
  //   secret: process.env.JWT_SECRET,
  // },
});
