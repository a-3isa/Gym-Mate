import { IsString, IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';

/**
 * DTO for recording a completed set
 * Used when a participant completes a set and records their performance
 * The backend will automatically determine which participant is recording
 * based on the authenticated user and current turn
 */
export class RecordSetDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @IsInt()
  @Min(1)
  setNumber: number;

  @IsNumber()
  @Min(0)
  weight: number; // in kilograms

  @IsInt()
  @Min(0)
  reps: number;
}
