import { IsOptional, IsString, IsIn, Matches } from 'class-validator';

/**
 * DTO for updating user's avatar visual customization configuration.
 * All fields are optional to support partial updates.
 * This controls the visual appearance of the avatar, separate from progression data.
 */
export class UpdateAvatarConfigDto {
  /**
   * Body type that affects base avatar proportions.
   * Options: 'slim' (lean build), 'athletic' (balanced), 'muscular' (broad), 'heavy' (larger frame)
   * @example 'athletic'
   */
  @IsOptional()
  @IsString()
  @IsIn(['slim', 'athletic', 'muscular', 'heavy'])
  bodyType?: 'slim' | 'athletic' | 'muscular' | 'heavy';

  /**
   * Skin tone color in hex format (#RRGGBB).
   * Used for avatar head and exposed skin areas.
   * Must be a valid 6-character hex color code.
   * @example '#FFE0BD'
   */
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'skinTone must be a valid hex color (#RRGGBB)' })
  skinTone?: string;

  /**
   * Hair style that determines hair shape and length.
   * Options: 'bald', 'short', 'medium', 'long', 'curly', 'buzz'
   * @example 'short'
   */
  @IsOptional()
  @IsString()
  @IsIn(['bald', 'short', 'medium', 'long', 'curly', 'buzz'])
  hairStyle?: 'bald' | 'short' | 'medium' | 'long' | 'curly' | 'buzz';

  /**
   * Hair color in hex format (#RRGGBB).
   * Applied to the selected hair style.
   * Must be a valid 6-character hex color code.
   * @example '#4A3728'
   */
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'hairColor must be a valid hex color (#RRGGBB)' })
  hairColor?: string;

  /**
   * Clothing style that determines outfit type.
   * Options: 'tank' (tank top), 'tshirt', 'hoodie', 'sports-bra', 'compression'
   * @example 'tshirt'
   */
  @IsOptional()
  @IsString()
  @IsIn(['tank', 'tshirt', 'hoodie', 'sports-bra', 'compression'])
  clothingStyle?: 'tank' | 'tshirt' | 'hoodie' | 'sports-bra' | 'compression';

  /**
   * Clothing color in hex format (#RRGGBB).
   * Applied to the selected clothing style.
   * Must be a valid 6-character hex color code.
   * @example '#3B82F6'
   */
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'clothingColor must be a valid hex color (#RRGGBB)' })
  clothingColor?: string;
}
