import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CAPABILITY_KEY = '@3d_capability';
const PREFERENCE_KEY = '@3d_preference';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CapabilityCache {
  capable: boolean;
  timestamp: number;
}

/**
 * Checks if the device is capable of rendering 3D avatars.
 * Uses cached results for 7 days to avoid repeated detection.
 * 
 * Detection heuristics:
 * - iOS: iPhone 8+ (2017 or newer) assumed capable
 * - Android: Requires 3GB+ RAM and 1080p+ screen resolution
 * 
 * @returns Promise<boolean> - true if device is 3D capable
 */
export async function checkDeviceCapability(): Promise<boolean> {
  try {
    // Check cached result first
    const cachedResult = await AsyncStorage.getItem(CAPABILITY_KEY);
    if (cachedResult) {
      const cache: CapabilityCache = JSON.parse(cachedResult);
      const now = Date.now();
      
      // Use cache if less than 7 days old
      if (now - cache.timestamp < CACHE_DURATION) {
        return cache.capable;
      }
    }

    // Run detection heuristics
    let capable = false;
    
    if (Platform.OS === 'ios') {
      // Check iOS device year via model name
      const modelName = Device.modelName || '';
      
      // iPhone 8 and newer (2017+) are considered capable
      // This is a simplified heuristic - all modern iOS devices should handle 3D well
      const iPhoneMatch = modelName.match(/iPhone (\d+)/);
      if (iPhoneMatch) {
        const model = parseInt(iPhoneMatch[1], 10);
        // iPhone 8 = iPhone10,x, iPhone X = iPhone10,x
        // Simplified: assume iPhone 8+ (model >= 10) are capable
        capable = model >= 8;
      } else if (modelName.includes('iPad')) {
        // All recent iPads should be capable
        capable = true;
      } else {
        // Default to capable for unknown iOS devices
        capable = true;
      }
    } else if (Platform.OS === 'android') {
      // Check Android device capabilities
      const totalMemory = Device.totalMemory;
      const { width, height } = Dimensions.get('screen');
      const screenResolution = Math.min(width, height); // Get smaller dimension
      
      // Require at least 3GB RAM and 1080p resolution
      const hasEnoughRam = totalMemory ? totalMemory >= 3 * 1024 * 1024 * 1024 : false;
      const hasGoodScreen = screenResolution >= 1080;
      
      capable = hasEnoughRam && hasGoodScreen;
    } else {
      // Unknown platform, default to not capable
      capable = false;
    }

    // Cache the result
    const cache: CapabilityCache = {
      capable,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CAPABILITY_KEY, JSON.stringify(cache));

    return capable;
  } catch (error) {
    console.error('Error checking device capability:', error);
    // Fallback to 2D on error
    return false;
  }
}

/**
 * Clears the capability cache, forcing re-detection on next check.
 */
export async function reset3DPreference(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CAPABILITY_KEY);
    await AsyncStorage.removeItem(PREFERENCE_KEY);
  } catch (error) {
    console.error('Error resetting 3D preferences:', error);
  }
}

/**
 * Gets the user's manual preference for 3D rendering.
 * Returns null if no preference is set (use device capability).
 * 
 * @returns Promise<boolean | null> - User's 3D preference or null if not set
 */
export async function get3DPreference(): Promise<boolean | null> {
  try {
    const preference = await AsyncStorage.getItem(PREFERENCE_KEY);
    if (preference !== null) {
      return JSON.parse(preference);
    }
    return null;
  } catch (error) {
    console.error('Error getting 3D preference:', error);
    return null;
  }
}

/**
 * Sets the user's manual preference for 3D rendering.
 * This overrides device capability detection.
 * 
 * @param enabled - Whether to enable 3D rendering
 */
export async function set3DPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCE_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('Error setting 3D preference:', error);
  }
}
