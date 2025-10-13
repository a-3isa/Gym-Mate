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
  // database: {
  //   url: process.env.DATABASE_URL,
  // },
  // firebase: {
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  // },
  // jwt: {
  //   secret: process.env.JWT_SECRET,
  // },
});
