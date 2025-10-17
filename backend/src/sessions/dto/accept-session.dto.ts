import { IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionExerciseDto } from './create-session.dto';

/**
 * DTO for accepting or declining a session invitation
 * The invited friend responds to a session invitation
 * If exercises are provided, both users must agree on the final exercise list before session starts
 */
export class AcceptSessionDto {
  @IsBoolean()
  accepted!: boolean; // true to accept, false to decline

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseDto)
  exercises?: SessionExerciseDto[]; // Invited user can propose exercise modifications
}
