import { Injectable, Inject } from '@nestjs/common';
import { Auth, CreateRequest, DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { AUTH } from '../firebase.tokens';

/**
 * AuthService
 *
 * Provides methods for Firebase Authentication operations including
 * token verification, user management, and custom claims.
 */
@Injectable()
export class AuthService {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

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
   * Verify a Firebase ID token
   * @param idToken Firebase ID token to verify
   * @returns Promise<DecodedIdToken> Decoded token with uid and claims
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(idToken);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      throw new Error(`Failed to verify ID token: ${message}`);
    }
  }

  /**
   * Get user record from Firebase Auth
   * @param uid User ID
   * @returns Promise<UserRecord> User record from Firebase Auth
   */
  async getUser(uid: string): Promise<UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error: unknown) {
      const code = this.getErrorCode(error);
      if (code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      const message = this.getErrorMessage(error);
      throw new Error(`Failed to get user ${uid}: ${message}`);
    }
  }

  /**
   * Create a new Firebase Auth user
   * Will be used in authentication phase
   * @param email User email
   * @param password User password
   * @param displayName Optional display name
   * @returns Promise<UserRecord> Created user record
   */
  async createUser(email: string, password: string, displayName?: string): Promise<UserRecord> {
    try {
      const createRequest: CreateRequest = {
        email,
        password,
        emailVerified: false,
      };

      if (displayName) {
        createRequest.displayName = displayName;
      }

      return await this.auth.createUser(createRequest);
    } catch (error: unknown) {
      const code = this.getErrorCode(error);
      if (code === 'auth/email-already-exists') {
        throw new Error(`Email ${email} is already registered`);
      }
      if (code === 'auth/invalid-password') {
        throw new Error('Password does not meet requirements');
      }
      const message = this.getErrorMessage(error);
      throw new Error(`Failed to create user: ${message}`);
    }
  }

  /**
   * Update user properties in Firebase Auth
   * @param uid User ID
   * @param properties Properties to update
   * @returns Promise<UserRecord> Updated user record
   */
  async updateUser(
    uid: string,
    properties: {
      email?: string;
      displayName?: string;
      photoURL?: string;
    },
  ): Promise<UserRecord> {
    try {
      return await this.auth.updateUser(uid, properties);
    } catch (error: unknown) {
      const code = this.getErrorCode(error);
      if (code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      if (code === 'auth/email-already-exists') {
        throw new Error('Email is already in use by another account');
      }
      const message = this.getErrorMessage(error);
      throw new Error(`Failed to update user ${uid}: ${message}`);
    }
  }

  /**
   * Delete a user from Firebase Auth
   * @param uid User ID
   * @returns Promise<void>
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
    } catch (error: unknown) {
      const code = this.getErrorCode(error);
      if (code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      const message = this.getErrorMessage(error);
      throw new Error(`Failed to delete user ${uid}: ${message}`);
    }
  }

  /**
   * Set custom claims for role-based access control
   * @param uid User ID
   * @param claims Custom claims object (e.g., { admin: true, premium: true })
   * @returns Promise<void>
   */
  async setCustomClaims(uid: string, claims: object): Promise<void> {
    try {
      await this.auth.setCustomUserClaims(uid, claims);
    } catch (error: unknown) {
      const code = this.getErrorCode(error);
      if (code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      const message = this.getErrorMessage(error);
      throw new Error(`Failed to set custom claims for user ${uid}: ${message}`);
    }
  }
}
