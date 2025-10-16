import React, { useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/api/auth.service';
import { User } from '../types/models';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that manages authentication state globally.
 * 
 * This provider wraps the app with authentication context, handling:
 * - Firebase authentication state changes
 * - User profile synchronization with backend
 * - Login, register, and logout operations
 * - Token management for API requests
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from backend
          const userProfile = await getUserProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Clear user state if profile fetch fails
          setUser(null);
        }
      } else {
        // User is not authenticated
        setUser(null);
      }
      
      // Initial auth check complete
      setLoading(false);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Sign in with Firebase
      const _userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile from backend
      const userProfile = await getUserProfile();
      setUser(userProfile);
    } catch (error: any) {
      // Translate Firebase error codes to user-friendly messages
      let message = 'Failed to sign in';
      
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later';
      }
      
      throw new Error(message);
    }
  };

  /**
   * Register new user account
   */
  const register = async (
    email: string,
    password: string,
    _displayName: string
  ): Promise<void> => {
    try {
      // Create user with Firebase
      const _userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Fetch/create user profile from backend
      // The backend will create the profile with the displayName
      const userProfile = await getUserProfile();
      setUser(userProfile);
    } catch (error: any) {
      // Translate Firebase error codes to user-friendly messages
      let message = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Email/password accounts are not enabled';
      }
      
      throw new Error(message);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw new Error('Failed to sign out');
    }
  };

  /**
   * Get the current Firebase ID token
   */
  const getIdToken = async (): Promise<string | null> => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return null;
    }
    
    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  };

  /**
   * Refresh user profile data from the backend
   * Used after profile updates to sync the auth context
   */
  const refreshProfile = async (): Promise<void> => {
    try {
      const userProfile = await getUserProfile();
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw new Error('Failed to refresh profile');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getIdToken,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
