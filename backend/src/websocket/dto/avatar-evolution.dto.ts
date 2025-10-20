import { IsString, IsNumber, IsArray } from 'class-validator';

/**
 * DTO for avatar evolution WebSocket events
 * Sent when a user's avatar levels up after session completion
 */
export class AvatarEvolutionDto {
  @IsString()
  sessionId!: string;

  @IsString()
  userId!: string;

  @IsNumber()
  previousLevel!: number;

  @IsNumber()
  newLevel!: number;

  @IsArray()
  muscleGroupsGained!: string[];

  @IsString()
  timestamp!: string;
}
