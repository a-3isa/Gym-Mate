import { useState, useEffect, useCallback } from 'react';
import useAuth from './useAuth';
import useAvatar from './useAvatar';
import { AvatarConfig, MuscleGroups } from '../types/models';
import { 
  checkDeviceCapability, 
  get3DPreference,
  set3DPreference 
} from '../utils/deviceCapability';

/**
 * Custom hook for 3D avatar state management.
 * Centralizes 3D avatar state and provides easy access to 3D capability/preference.
 * 
 * @returns {Object} Avatar configuration, muscle groups, loading state, and 3D controls
 */
export const use3DAvatar = () => {
  const { user } = useAuth();
  const { avatarState } = useAvatar();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [is3DCapable, setIs3DCapable] = useState<boolean>(false);
  const [is3DEnabled, setIs3DEnabled] = useState<boolean>(false);

  // Extract avatar config and muscle groups from user and avatar state
  const avatarConfig: AvatarConfig | undefined = user?.avatarConfig;
  const muscleGroups: MuscleGroups = avatarState?.muscleGroups || {
    chest: 1,
    back: 1,
    legs: 1,
    shoulders: 1,
    arms: 1,
    core: 1,
  };

  // Check device capability on mount
  useEffect(() => {
    const checkCapability = async () => {
      try {
        setLoading(true);
        
        // Check if device is capable of 3D
        const capable = await checkDeviceCapability();
        setIs3DCapable(capable);
        
        // Check user preference
        const preference = await get3DPreference();
        
        // If user has set a preference, use it; otherwise default to capability
        const enabled = preference !== null ? preference : capable;
        setIs3DEnabled(enabled && capable); // Can only be enabled if capable
      } catch (error) {
        console.error('Error checking 3D capability:', error);
        setIs3DCapable(false);
        setIs3DEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkCapability();
  }, []);

  /**
   * Toggle 3D rendering on/off.
   * Updates user preference and triggers re-render.
   */
  const toggle3D = useCallback(async (enable: boolean) => {
    try {
      // Can't enable if device is not capable
      if (enable && !is3DCapable) {
        console.warn('Cannot enable 3D on non-capable device');
        return;
      }

      // Update preference
      await set3DPreference(enable);
      setIs3DEnabled(enable);
    } catch (error) {
      console.error('Error toggling 3D:', error);
    }
  }, [is3DCapable]);

  return {
    avatarConfig,
    muscleGroups,
    loading,
    is3DCapable,
    is3DEnabled,
    toggle3D,
  };
};
