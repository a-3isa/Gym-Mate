import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';

/**
 * Data Transfer Object for updating user profile
 * Used for validating profile update requests
 */
export class UpdateProfileDto {
  /**
   * User's display name
   * Must be 2-50 characters long
   * Allowed characters: letters, spaces, hyphens, apostrophes
   */
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[\p{L}\s\-']+$/u, {
    message: 'Display name can only contain letters, spaces, hyphens, and apostrophes',
  })
  displayName?: string;

  /**
   * User's height in centimeters
   * Valid range: 50-300 cm
   */
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(300)
  height?: number;

  /**
   * User's weight in kilograms
   * Valid range: 20-500 kg
   */
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(20)
  @Max(500)
  weight?: number;
}
