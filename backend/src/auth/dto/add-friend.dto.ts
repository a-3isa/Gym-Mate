import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

/**
 * Data Transfer Object for adding a friend by email
 * Used when searching for and adding friends
 * The backend performs case-insensitive exact match to find the user
 */
export class AddFriendDto {
  /**
   * Email address of the user to add as a friend
   * Must be a valid email format
   */
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
