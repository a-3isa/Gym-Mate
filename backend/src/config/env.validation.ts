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
