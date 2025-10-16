import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './config';

/**
 * Initialize Firebase Authentication with React Native persistence.
 * 
 * This module handles Firebase app initialization and Auth service setup.
 * It uses AsyncStorage for persistent sessions across app restarts,
 * ensuring users remain logged in until they explicitly sign out.
 * 
 * Warning: Do not re-initialize Firebase if already initialized.
 * This can cause errors and unexpected behavior.
 */

let auth: Auth;

// Check if Firebase app is already initialized
if (getApps().length === 0) {
  // Initialize Firebase app
  const app = initializeApp(firebaseConfig);
  
  // Initialize Auth with React Native persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  // Use existing Firebase app
  const app = getApp();
  auth = getAuth(app);
}

export { auth };
