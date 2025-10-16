import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AuthService } from './auth.service';
import { StorageService } from '../firebase/services/storage.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/interfaces/user.interface';
import { UpdateProfileDto, AddFriendDto } from './dto';
import { UserNotFoundError, AlreadyFriendsError, SelfAddForbiddenError } from './auth.errors';

type PublicUser = Pick<User, 'uid' | 'displayName' | 'photoURL' | 'email'>;

/**
 * Controller handling authentication endpoints.
 * Manages user profile retrieval and automatic creation on first login.
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get or create the authenticated user's profile.
   * This endpoint is called by the mobile app after successful Firebase authentication
   * to sync the user profile with the backend.
   *
   * On first login, it automatically creates a user document in Firestore.
   * On subsequent logins, it returns the existing user profile.
   *
   * @param user - The authenticated user information from Firebase token
   * @returns The user profile data
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(
    @CurrentUser()
    user: {
      uid: string;
      email: string;
      displayName?: string;
      emailVerified: boolean;
      picture?: string;
    },
  ): Promise<User> {
    try {
      if (!user || !user.uid) {
        throw new HttpException('User information not found', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Getting profile for user ${user.uid}`);

      // Get or create the user profile in Firestore
      const userProfile = await this.authService.getOrCreateUser(
        user.uid,
        user.email,
        user.displayName,
      );

      if (!userProfile) {
        throw new HttpException(
          'Failed to retrieve user profile',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return userProfile;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get user profile: ${message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'An error occurred while retrieving the user profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error instanceof Error ? error : undefined,
        },
      );
    }
  }

  /**
   * Update the authenticated user's profile.
   * Validates and updates user profile fields like displayName, height, and weight.
   *
   * @param updateProfileDto - The profile fields to update
   * @param user - The authenticated user information
   * @returns The updated user profile
   */
  @Patch('profile')
  @UseGuards(FirebaseAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: { uid: string },
  ): Promise<User> {
    try {
      this.logger.debug(`Updating profile for user ${user.uid}`);

      const safeUpdates: Partial<Pick<User, 'displayName' | 'height' | 'weight'>> = {};

      if (typeof updateProfileDto.displayName !== 'undefined') {
        safeUpdates.displayName = updateProfileDto.displayName;
      }

      if (typeof updateProfileDto.height !== 'undefined') {
        safeUpdates.height = updateProfileDto.height;
      }

      if (typeof updateProfileDto.weight !== 'undefined') {
        safeUpdates.weight = updateProfileDto.weight;
      }

      const updatedUser = await this.authService.updateUserProfile(user.uid, safeUpdates);

      return updatedUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update profile for user ${user.uid}: ${message}`);

      throw new HttpException('Failed to update profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Upload and update the user's avatar image.
   * Accepts image files up to 5MB in JPEG, PNG, or WebP format.
   *
   * @param file - The uploaded avatar image file
   * @param user - The authenticated user information
   * @returns The updated user profile with new photoURL
   */
  @Post('avatar')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5000000 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { uid: string },
  ): Promise<User> {
    try {
      this.logger.debug(`Uploading avatar for user ${user.uid}`);

      // Upload avatar to storage
      const { downloadUrl } = await this.storageService.uploadAvatar(
        user.uid,
        file.buffer,
        file.mimetype,
      );

      // Update user profile with new photoURL
      const updatedUser = await this.authService.updateUserProfile(
        user.uid,
        {
          photoURL: downloadUrl,
        },
        { allowPhotoURL: true },
      );

      return updatedUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload avatar for user ${user.uid}: ${message}`);

      throw new HttpException('Failed to upload avatar', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Search for a user by email address.
   * Returns null instead of 404 to prevent email enumeration attacks.
   * Note: Rate limiting should be implemented in production.
   *
   * @param email - The email address to search for
   * @param user - The authenticated user information
   * @returns The found user or null
   */
  @Get('search')
  @UseGuards(FirebaseAuthGuard)
  async searchUser(
    @Query('email') email: string,
    @CurrentUser() user: { uid: string },
  ): Promise<PublicUser | null> {
    try {
      if (!email) {
        return null;
      }

      // Trim and lowercase email
      const trimmedEmail = email.trim().toLowerCase();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return null;
      }

      this.logger.debug(`User ${user.uid} searching for user with email: ${trimmedEmail}`);

      // Search for user (returns null if not found to prevent enumeration)
      const foundUser = await this.authService.searchUserByEmail(trimmedEmail);

      if (!foundUser) {
        return null;
      }

      // Prevent users from finding themselves
      if (foundUser.uid === user.uid) {
        return null;
      }

      const publicUser: PublicUser = {
        uid: foundUser.uid,
        displayName: foundUser.displayName,
        photoURL: foundUser.photoURL,
        email: foundUser.email,
      };

      return publicUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to search user: ${message}`);

      // Return null for any errors to prevent information leakage
      return null;
    }
  }

  /**
   * Get the list of friends for the authenticated user.
   *
   * @param user - The authenticated user information
   * @returns Array of friend User objects
   */
  @Get('friends')
  @UseGuards(FirebaseAuthGuard)
  async getFriends(@CurrentUser() user: { uid: string }): Promise<User[]> {
    try {
      this.logger.debug(`Getting friends for user ${user.uid}`);

      const friends = await this.authService.getFriends(user.uid);

      return friends;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get friends for user ${user.uid}: ${message}`);

      throw new HttpException('Failed to retrieve friends', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Add a friend by email address.
   * Validates that the friend exists, is not already a friend, and is not the user themselves.
   *
   * @param addFriendDto - DTO containing the friend's email
   * @param user - The authenticated user information
   * @returns Success message with updated friends list
   */
  @Post('friends')
  @UseGuards(FirebaseAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async addFriend(
    @Body() addFriendDto: AddFriendDto,
    @CurrentUser() user: { uid: string },
  ): Promise<{ message: string; friends: string[] }> {
    try {
      this.logger.debug(`User ${user.uid} adding friend with email: ${addFriendDto.email}`);

      const result = await this.authService.addFriend(user.uid, addFriendDto.email);

      return {
        message: 'Friend added successfully',
        friends: result.friends,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to add friend for user ${user.uid}: ${message}`);

      if (error instanceof UserNotFoundError) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      } else if (error instanceof AlreadyFriendsError) {
        throw new HttpException('Already friends with this user', HttpStatus.CONFLICT);
      } else if (error instanceof SelfAddForbiddenError) {
        throw new HttpException('Cannot add yourself as a friend', HttpStatus.BAD_REQUEST);
      }

      throw new HttpException('Failed to add friend', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Remove a friend from the user's friend list.
   *
   * @param friendUid - The UID of the friend to remove
   * @param user - The authenticated user information
   * @returns Success message
   */
  @Delete('friends/:friendUid')
  @UseGuards(FirebaseAuthGuard)
  async removeFriend(
    @Param('friendUid') friendUid: string,
    @CurrentUser() user: { uid: string },
  ): Promise<{ message: string }> {
    try {
      this.logger.debug(`User ${user.uid} removing friend ${friendUid}`);

      await this.authService.removeFriend(user.uid, friendUid);

      return {
        message: 'Friend removed successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to remove friend for user ${user.uid}: ${message}`);

      throw new HttpException('Failed to remove friend', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
