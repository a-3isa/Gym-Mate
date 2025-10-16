import { Injectable, Logger } from '@nestjs/common';
import { FieldValue, UpdateData } from 'firebase-admin/firestore';
import { FirestoreService } from '../firebase/services/firestore.service';
import { AuthService as FirebaseAuthService } from '../firebase/services/auth.service';
import { User } from '../common/interfaces/user.interface';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import { UserNotFoundError, AlreadyFriendsError, SelfAddForbiddenError } from './auth.errors';

/**
 * Service handling user authentication and profile management.
 * Manages user documents in Firestore and provides profile CRUD operations.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
    return typeof error === 'string' ? error : 'Unknown error';
  }

  private getErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      if (typeof code === 'string') {
        return code;
      }
    }
    return undefined;
  }

  /**
   * Gets or creates a user document in Firestore.
   * Called on first authentication to ensure user profile exists.
   *
   * @param uid - The Firebase user ID
   * @param email - The user's email address
   * @param displayName - Optional display name for the user
   * @returns The user document data
   */
  async getOrCreateUser(uid: string, email: string, displayName?: string): Promise<User> {
    try {
      const normalizedEmail = email.toLowerCase();

      // Check if user document exists
      const docRef = this.firestoreService.getDocument<User>(COLLECTIONS.USERS, uid);

      let existingUser: User | null = null;

      try {
        const docSnap = await docRef.get();
        existingUser = docSnap.exists ? (docSnap.data() ?? null) : null;
      } catch (error: unknown) {
        if (!this.isFirestoreNotFoundError(error)) {
          throw error;
        }

        this.logger.debug(`User ${uid} not found in Firestore, creating new profile`);
      }

      if (existingUser) {
        const needsEmailLowerUpdate =
          !('emailLower' in existingUser) || existingUser.emailLower !== normalizedEmail;

        const needsUidUpdate = !('uid' in existingUser) || existingUser.uid !== uid;

        const updatePayload: UpdateData<User> = {
          updatedAt: FieldValue.serverTimestamp() as unknown as User['updatedAt'],
        };

        if (needsEmailLowerUpdate) {
          updatePayload.emailLower = normalizedEmail;
        }

        if (needsUidUpdate) {
          updatePayload.uid = uid;
        }

        await this.firestoreService.updateDocument(COLLECTIONS.USERS, uid, updatePayload);

        this.logger.debug(
          `User ${uid} already exists, updated timestamp${needsUidUpdate ? ' and backfilled uid' : ''}${needsEmailLowerUpdate ? ' and emailLower' : ''}`,
        );
        return {
          ...existingUser,
          ...(needsEmailLowerUpdate ? { emailLower: normalizedEmail } : {}),
          ...(needsUidUpdate ? { uid: uid } : {}),
        };
      }

      // Create new user document
      const newUser = {
        uid,
        email,
        emailLower: normalizedEmail,
        displayName: displayName || email.split('@')[0], // Use email prefix if no display name
        friends: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await this.firestoreService.setDocument(COLLECTIONS.USERS, uid, newUser);

      this.logger.log(`Created new user profile for ${uid}`);

      // Return the created user (fetch to get server timestamps)
      const newDocRef = this.firestoreService.getDocument<User>(COLLECTIONS.USERS, uid);
      const newDocSnap = await newDocRef.get();
      return newDocSnap.data() as User;
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to get or create user ${uid}: ${message}`);
      throw error;
    }
  }

  /**
   * Retrieves a user's profile from Firestore.
   *
   * @param uid - The Firebase user ID
   * @returns The user profile data or null if not found
   */
  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const docRef = this.firestoreService.getDocument<User>(COLLECTIONS.USERS, uid);
      const docSnap = await docRef.get();
      const user = docSnap.exists ? docSnap.data() : null;

      if (!user) {
        this.logger.warn(`User profile not found for ${uid}`);
        return null;
      }

      return user;
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to get user profile ${uid}: ${message}`);
      throw error;
    }
  }

  /**
   * Updates a user's profile in Firestore.
   *
   * @param uid - The Firebase user ID
   * @param updates - Partial user object with fields to update
   * @returns The updated user profile
   */
  async updateUserProfile(
    uid: string,
    updates: Partial<User>,
    options?: { allowPhotoURL?: boolean },
  ): Promise<User> {
    try {
      const { allowPhotoURL = false } = options ?? {};

      const safeUpdates: Partial<Pick<User, 'displayName' | 'height' | 'weight' | 'photoURL'>> = {};

      if (
        Object.prototype.hasOwnProperty.call(updates, 'displayName') &&
        updates.displayName !== undefined
      ) {
        safeUpdates.displayName = updates.displayName;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'height') && updates.height !== undefined) {
        safeUpdates.height = updates.height;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'weight') && updates.weight !== undefined) {
        safeUpdates.weight = updates.weight;
      }

      if (
        allowPhotoURL &&
        Object.prototype.hasOwnProperty.call(updates, 'photoURL') &&
        updates.photoURL !== undefined
      ) {
        safeUpdates.photoURL = updates.photoURL;
      }

      // Add updated timestamp
      const updateData: UpdateData<User> = {
        ...(safeUpdates as UpdateData<User>),
        updatedAt: FieldValue.serverTimestamp() as unknown as User['updatedAt'],
      };

      if (Object.keys(updateData).length === 1) {
        // Only updatedAt would be present, nothing to update
        this.logger.debug(`No valid profile fields provided for user ${uid}`);
        const updatedDocRef = this.firestoreService.getDocument<User>(COLLECTIONS.USERS, uid);
        const updatedDocSnap = await updatedDocRef.get();
        return updatedDocSnap.data() as User;
      }

      await this.firestoreService.updateDocument(COLLECTIONS.USERS, uid, updateData);

      this.logger.log(`Updated user profile for ${uid}`);

      // Return the updated user
      const updatedDocRef = this.firestoreService.getDocument<User>(COLLECTIONS.USERS, uid);
      const updatedDocSnap = await updatedDocRef.get();
      return updatedDocSnap.data() as User;
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to update user profile ${uid}: ${message}`);
      throw error;
    }
  }

  private isFirestoreNotFoundError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const code = (error as { code?: unknown }).code;
    if (code === 5 || code === '5' || code === 'NOT_FOUND') {
      return true;
    }

    const message =
      error instanceof Error
        ? error.message
        : typeof (error as { message?: unknown }).message === 'string'
          ? ((error as { message?: string }).message as string)
          : undefined;

    return typeof message === 'string' && message.includes('NOT_FOUND');
  }

  /**
   * Searches for a user by their email address.
   * Performs case-insensitive exact match on the email field.
   *
   * @param email - The email address to search for
   * @returns The user if found, null otherwise
   */
  async searchUserByEmail(email: string): Promise<User | null> {
    try {
      const normalizedEmail = email.toLowerCase();
      const querySnapshot = await this.firestoreService.queryDocuments<User>(COLLECTIONS.USERS, [
        { field: 'emailLower', operator: '==', value: normalizedEmail },
      ]);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }

      // Fallback for legacy documents without emailLower field - use original case
      const fallbackQuerySnapshot = await this.firestoreService.queryDocuments<User>(
        COLLECTIONS.USERS,
        [{ field: 'email', operator: '==', value: email }],
      );

      if (fallbackQuerySnapshot.empty) {
        this.logger.debug(`No user found with email: ${email}`);
        return null;
      }

      if (fallbackQuerySnapshot.docs.length > 1) {
        this.logger.warn(`Multiple users found with email: ${email}, returning first match`);
      }

      const foundUser = fallbackQuerySnapshot.docs[0].data();

      // Optionally backfill emailLower field for legacy documents
      if (foundUser && !foundUser.emailLower) {
        try {
          await this.firestoreService.updateDocument(COLLECTIONS.USERS, foundUser.uid, {
            emailLower: normalizedEmail,
          });
          this.logger.debug(`Backfilled emailLower for user ${foundUser.uid}`);
        } catch (updateError) {
          this.logger.warn(
            `Failed to backfill emailLower for user ${foundUser.uid}: ${this.getErrorMessage(updateError)}`,
          );
        }
      }

      return foundUser;
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to search user by email ${email}: ${message}`);
      throw error;
    }
  }

  /**
   * Adds a friend relationship between two users.
   * Validates friend exists, not already friends, and not adding self.
   * Updates both users' friends arrays atomically.
   *
   * @param userId - The user adding a friend
   * @param friendEmail - The email of the friend to add
   * @returns Success status with updated friends list
   * @throws Error if friend not found, already friends, or trying to add self
   */
  async addFriend(
    userId: string,
    friendEmail: string,
  ): Promise<{ success: boolean; friends: string[] }> {
    try {
      // Search for the friend by email
      const friend = await this.searchUserByEmail(friendEmail);
      if (!friend) {
        throw new UserNotFoundError('User not found');
      }

      const friendUid = friend.uid;

      // Check if trying to add self
      if (userId === friendUid) {
        throw new SelfAddForbiddenError('Cannot add yourself as a friend');
      }

      // Get current user to check existing friends
      const currentUser = await this.getUserProfile(userId);
      if (!currentUser) {
        throw new UserNotFoundError('Current user not found');
      }

      // Check if already friends
      if (currentUser.friends && currentUser.friends.includes(friendUid)) {
        throw new AlreadyFriendsError('Already friends with this user');
      }

      // Use batch write to update both users atomically
      await this.firestoreService.batchWrite([
        {
          type: 'update',
          collection: COLLECTIONS.USERS,
          docId: userId,
          data: {
            friends: FieldValue.arrayUnion(friendUid),
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
        {
          type: 'update',
          collection: COLLECTIONS.USERS,
          docId: friendUid,
          data: {
            friends: FieldValue.arrayUnion(userId),
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
      ]);

      this.logger.log(`Added friend relationship between ${userId} and ${friendUid}`);

      // Return updated friends list
      const updatedUser = await this.getUserProfile(userId);
      return {
        success: true,
        friends: updatedUser?.friends || [],
      };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to add friend for user ${userId}: ${message}`);
      throw error;
    }
  }

  /**
   * Removes a friend relationship between two users.
   * Updates both users' friends arrays atomically.
   *
   * @param userId - The user removing a friend
   * @param friendUid - The UID of the friend to remove
   * @returns Success status
   */
  async removeFriend(userId: string, friendUid: string): Promise<{ success: boolean }> {
    try {
      // Use batch write to update both users atomically
      await this.firestoreService.batchWrite([
        {
          type: 'update',
          collection: COLLECTIONS.USERS,
          docId: userId,
          data: {
            friends: FieldValue.arrayRemove(friendUid),
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
        {
          type: 'update',
          collection: COLLECTIONS.USERS,
          docId: friendUid,
          data: {
            friends: FieldValue.arrayRemove(userId),
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
      ]);

      this.logger.log(`Removed friend relationship between ${userId} and ${friendUid}`);

      return { success: true };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to remove friend for user ${userId}: ${message}`);
      throw error;
    }
  }

  /**
   * Gets the list of friends for a user.
   * Fetches full profile data for each friend by document ID.
   *
   * @param userId - The user whose friends to retrieve
   * @returns Array of friend User objects with profile data
   */
  async getFriends(userId: string): Promise<User[]> {
    try {
      // Get the user's friends array
      const user = await this.getUserProfile(userId);
      if (!user || !user.friends || user.friends.length === 0) {
        return [];
      }

      // Fetch friend profiles by document IDs using Promise.all
      const friendUids = user.friends;
      const docPromises = friendUids.map((friendUid) => {
        const docRef = this.firestoreService.getDocument<User>(COLLECTIONS.USERS, friendUid);
        return docRef.get();
      });

      const docSnapshots = await Promise.all(docPromises);

      // Filter out non-existent documents and extract data
      const friendProfiles: User[] = docSnapshots
        .filter((docSnap) => docSnap.exists)
        .map((docSnap) => docSnap.data() as User);

      this.logger.debug(`Retrieved ${friendProfiles.length} friends for user ${userId}`);

      return friendProfiles;
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to get friends for user ${userId}: ${message}`);
      throw error;
    }
  }
}
