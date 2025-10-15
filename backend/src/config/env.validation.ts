import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

export class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT?: number;

  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  HEALTH_HEAP_LIMIT_MB?: number;

  @IsString()
  @IsOptional()
  CORS_ALLOWED_ORIGINS?: string;

  // Firebase Configuration
  @IsString()
  @IsOptional() // Optional for emulator mode and Application Default Credentials
  FIREBASE_PROJECT_ID?: string;

  @IsString()
  @IsOptional()
  FIREBASE_CLIENT_EMAIL?: string;

  @IsString()
  @IsOptional()
  FIREBASE_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  FIREBASE_STORAGE_BUCKET?: string;

  // Firebase Emulator Configuration
  @IsString()
  @IsOptional()
  FIRESTORE_EMULATOR_HOST?: string;

  @IsString()
  @IsOptional()
  FIREBASE_AUTH_EMULATOR_HOST?: string;

  @IsString()
  @IsOptional()
  FIREBASE_STORAGE_EMULATOR_HOST?: string;

  // WebSocket Configuration
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  WEBSOCKET_PORT?: number;

  @IsString()
  @IsOptional()
  WEBSOCKET_CORS_ORIGIN?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => {
        const constraints = Object.values(error.constraints ?? {}).join(', ');
        return constraints ? `${error.property}: ${constraints}` : error.property;
      })
      .join('; ');
    throw new Error(message);
  }
  return validatedConfig;
}
