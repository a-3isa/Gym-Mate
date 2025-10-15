import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsInt, Min, IsOptional } from 'class-validator';

/**
 * SetCompleteDto
 *
 * Data Transfer Object for set:complete event payload.
 * Used when a participant completes a set and reports their performance.
 */
export class SetCompleteDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  setNumber!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  reps!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;
}
