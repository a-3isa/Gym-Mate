import { Injectable, Inject } from '@nestjs/common';
import { Auth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { AUTH } from '../firebase.module';

/**
 * AuthService
 *
 * Provides methods for Firebase Authentication operations including
 * token verification, user management, and custom claims.
 */
@Injectable()
export class AuthService {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  /**
   * Verify a Firebase ID token
   * @param idToken Firebase ID token to verify
   * @returns Promise<DecodedIdToken> Decoded token with uid and claims
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(idToken);
    } catch (error) {
      throw new Error(`Failed to verify ID token: ${error.message}`);
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
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      throw new Error(`Failed to get user ${uid}: ${error.message}`);
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
      const createRequest: any = {
        email,
        password,
        emailVerified: false,
      };

      if (displayName) {
        createRequest.displayName = displayName;
      }

      return await this.auth.createUser(createRequest);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new Error(`Email ${email} is already registered`);
      }
      if (error.code === 'auth/invalid-password') {
        throw new Error('Password does not meet requirements');
      }
      throw new Error(`Failed to create user: ${error.message}`);
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
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      if (error.code === 'auth/email-already-exists') {
        throw new Error('Email is already in use by another account');
      }
      throw new Error(`Failed to update user ${uid}: ${error.message}`);
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
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      throw new Error(`Failed to delete user ${uid}: ${error.message}`);
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
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`User with UID ${uid} not found`);
      }
      throw new Error(`Failed to set custom claims for user ${uid}: ${error.message}`);
    }
  }
}
