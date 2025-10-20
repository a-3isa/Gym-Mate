import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CAPABILITY_KEY = '@3d_capability';
const PREFERENCE_KEY = '@3d_preference';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

type PreferenceListener = (enabled: boolean | null) => void;
const preferenceListeners = new Set<PreferenceListener>();

interface DetectionInputs {
  platform: string;
  deviceYearClass?: number;
  totalMemory?: number;
  minPixels?: number;
  hasEnoughRam?: boolean;
  iosFallbackReason?: string;
}

interface CapabilityCache {
  capable: boolean;
  timestamp: number;
  // Store detection inputs for debugging
  detectionInputs?: DetectionInputs;
}

/**
 * Checks if the device is capable of rendering 3D avatars.
 * Uses cached results for 7 days to avoid repeated detection.
 * 
 * Detection heuristics:
 * - iOS: Uses Device.deviceYearClass - devices from 2017+ are considered capable
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
    const detectionInputs: DetectionInputs = { platform: Platform.OS };
    
    if (Platform.OS === 'ios') {
      // Use Device.deviceYearClass for consistent iOS detection
      const deviceYearClass = Device.deviceYearClass;
      if (deviceYearClass != null) {
        detectionInputs.deviceYearClass = deviceYearClass;
      }
      
      // Devices from 2017 and newer (iPhone 8+) are considered capable
      if (deviceYearClass) {
        capable = deviceYearClass >= 2017;
      } else {
        capable = false;
        detectionInputs.iosFallbackReason = 'deviceYearClass_undefined';
      }
    } else if (Platform.OS === 'android') {
      // Check Android device capabilities
      const totalMemory = Device.totalMemory;
      const { width, height } = Dimensions.get('screen');
      const scale = PixelRatio.get();
      const minPixels = Math.min(width, height) * scale;

      if (typeof totalMemory === 'number') {
        detectionInputs.totalMemory = totalMemory;
      }
      detectionInputs.minPixels = minPixels;

      // Require at least 3GB RAM and 1080p resolution
      const hasEnoughRam = typeof totalMemory === 'number' ? totalMemory >= 3 * 1024 * 1024 * 1024 : false;
      const hasGoodScreen = minPixels >= 1080;
      detectionInputs.hasEnoughRam = hasEnoughRam;

      capable = hasEnoughRam && hasGoodScreen;
    } else {
      // Unknown platform, default to not capable
      capable = false;
    }

    // Cache the result with detection inputs for debugging
    const cache: CapabilityCache = {
      capable,
      timestamp: Date.now(),
      detectionInputs,
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
    preferenceListeners.forEach((listener) => listener(null));
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
    preferenceListeners.forEach((listener) => listener(enabled));
  } catch (error) {
    console.error('Error setting 3D preference:', error);
  }
}

export function add3DPreferenceListener(listener: PreferenceListener): () => void {
  preferenceListeners.add(listener);
  return () => {
    preferenceListeners.delete(listener);
  };
}
