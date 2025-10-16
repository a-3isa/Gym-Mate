import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

/**
 * Custom hook for accessing authentication context.
 * 
 * This hook provides access to authentication state and methods.
 * It must be used within an AuthProvider component.
 * 
 * @example
 * ```typescript
 * const { user, login, logout } = useAuth();
 * ```
 * 
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context value
 */
export default function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
