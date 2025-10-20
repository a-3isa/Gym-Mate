import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import ThreeAvatarView from './ThreeAvatarView';
import AvatarDisplay from './AvatarDisplay';
import { AvatarConfig, MuscleGroups } from '../../types/models';
import { checkDeviceCapability, get3DPreference } from '../../utils/deviceCapability';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { SPACING } from '../../utils/constants';

/**
 * Props for the Avatar3DDisplay component
 */
interface Avatar3DDisplayProps {
  /** Avatar customization configuration */
  avatarConfig?: AvatarConfig;
  /** Muscle group development levels */
  muscleGroups: MuscleGroups;
  /** Size of the avatar display in pixels */
  size?: number;
  /** Force 2D rendering regardless of device capability */
  force2D?: boolean;
  /** Callback when render mode changes */
  onRenderModeChange?: (mode: '2d' | '3d') => void;
}

/**
 * Hybrid avatar component that intelligently chooses between 3D and 2D rendering.
 * 
 * Rendering Strategy:
 * 1. Check device capability and user preference
 * 2. Start with 3D if capable and preferred
 * 3. Monitor performance and auto-downgrade to 2D if FPS drops
 * 4. Fall back to 2D on any 3D rendering errors
 * 
 * This component maintains backward compatibility while adding 3D as an enhancement layer.
 */
const Avatar3DDisplay: React.FC<Avatar3DDisplayProps> = ({
  avatarConfig,
  muscleGroups,
  size = 200,
  force2D = false,
  onRenderModeChange,
}) => {
  const [use3D, setUse3D] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [performanceIssue, setPerformanceIssue] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<boolean>(false);

  // Check device capability and user preference on mount
  useEffect(() => {
    const checkCapabilityAndPreference = async () => {
      try {
        // Skip 3D if forced to 2D
        if (force2D) {
          setUse3D(false);
          setLoading(false);
          return;
        }

        // Check device capability
        const isCapable = await checkDeviceCapability();
        if (!isCapable) {
          setUse3D(false);
          setLoading(false);
          return;
        }

        // Check user preference
        const preference = await get3DPreference();
        const shouldUse3D = preference !== null ? preference : isCapable;
        
        setUse3D(shouldUse3D);
        if (onRenderModeChange) {
          onRenderModeChange(shouldUse3D ? '3d' : '2d');
        }
      } catch (error) {
        console.error('Error checking 3D capability:', error);
        setUse3D(false);
      } finally {
        setLoading(false);
      }
    };

    checkCapabilityAndPreference();
  }, [force2D, onRenderModeChange]);

  // Monitor performance when using 3D
  useEffect(() => {
    if (use3D && !performanceIssue) {
      let consecutiveLowFPS = 0;
      
      // Set up performance monitoring
      performanceMonitor.handleLowPerformance(() => {
        consecutiveLowFPS++;
        
        // Auto-downgrade after 5 consecutive low FPS readings
        if (consecutiveLowFPS >= 5) {
          console.warn('Auto-downgrading from 3D to 2D due to low performance');
          setPerformanceIssue(true);
          setUse3D(false);
          
          if (onRenderModeChange) {
            onRenderModeChange('2d');
          }
        }
      });
      
      performanceMonitor.startMonitoring();

      // Cleanup
      return () => {
        performanceMonitor.stopMonitoring();
      };
    }
  }, [use3D, performanceIssue, onRenderModeChange]);

  // Error boundary effect
  const handleRenderError = () => {
    console.error('3D rendering error, falling back to 2D');
    setRenderError(true);
    setUse3D(false);
    
    if (onRenderModeChange) {
      onRenderModeChange('2d');
    }
  };

  // Show loading spinner while checking capabilities
  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Determine which renderer to use
  const shouldRender3D = use3D && !performanceIssue && !renderError && !force2D;

  if (shouldRender3D) {
    // Wrap in error boundary
    try {
      return (
        <ThreeAvatarView
          avatarConfig={avatarConfig}
          muscleGroups={muscleGroups}
          size={size}
          cameraAngle="front"
        />
      );
    } catch (error) {
      handleRenderError();
      // Fall through to 2D renderer
    }
  }

  // Fall back to 2D SVG renderer
  return (
    <AvatarDisplay
      avatarConfig={avatarConfig}
      muscleGroups={muscleGroups}
      size={size}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Avatar3DDisplay;
