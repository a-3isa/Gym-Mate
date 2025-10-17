import { useState, useEffect, useCallback } from 'react';
import { getAvatarState } from '../services/api/avatar.service';
import { AvatarState } from '../types/models';
import useAuth from './useAuth';

/**
 * Custom hook for managing avatar state
 * Provides avatar data fetching, loading states, error handling, and refresh capability
 * 
 * @returns Object containing avatar state, loading status, error, and refresh function
 */
export default function useAvatar() {
  const { user } = useAuth();
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the latest avatar state from the backend
   */
  const fetchAvatar = useCallback(async () => {
    if (!user) {
      setAvatarState(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const avatar = await getAvatarState();
      setAvatarState(avatar);
    } catch (err: any) {
      console.error('Error fetching avatar:', err);
      setError(err.message || 'Failed to load avatar');
      setAvatarState(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Refreshes the avatar state
   * Useful after session completion or manual refresh
   */
  const refreshAvatar = useCallback(() => {
    return fetchAvatar();
  }, [fetchAvatar]);

  // Fetch avatar on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchAvatar();
    } else {
      setAvatarState(null);
    }
  }, [user, fetchAvatar]);

  return {
    avatarState,
    loading,
    error,
    refreshAvatar,
  };
}
