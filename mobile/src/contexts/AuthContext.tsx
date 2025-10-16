import { createContext } from 'react';
import { User } from '../types/models';

/**
 * Authentication context type definition.
 * Defines the shape of the authentication context value.
 */
export interface AuthContextType {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  
  /** Loading state indicator for auth operations */
  loading: boolean;
  
  /** 
   * Login function accepting email and password.
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise that resolves when login is complete
   */
  login: (email: string, password: string) => Promise<void>;
  
  /**
   * Register function for creating new accounts.
   * @param email - User's email address
   * @param password - User's password
   * @param displayName - User's display name
   * @returns Promise that resolves when registration is complete
   */
  register: (email: string, password: string, displayName: string) => Promise<void>;
  
  /**
   * Logout function.
   * @returns Promise that resolves when logout is complete
   */
  logout: () => Promise<void>;
  
  /**
   * Get the current Firebase ID token.
   * @returns Promise that resolves with the ID token or null
   */
  getIdToken: () => Promise<string | null>;
  
  /**
   * Refresh the user profile from the backend.
   * Used after profile updates to sync the auth context.
   * @returns Promise that resolves when profile is refreshed
   */
  refreshProfile: () => Promise<void>;
}

/**
 * AuthContext provides authentication state and methods throughout the app.
 * This context manages user authentication, registration, and session management.
 */
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  getIdToken: async () => null,
  refreshProfile: async () => {},
});
