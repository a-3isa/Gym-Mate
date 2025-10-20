import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import ThreeAvatarView from './ThreeAvatarView';
import AvatarDisplay from './AvatarDisplay';
import ErrorBoundary from '../common/ErrorBoundary';
import { AvatarConfig, Avatar3DConfig, MuscleGroups } from '../../types/models';
import {
  checkDeviceCapability,
  get3DPreference,
  add3DPreferenceListener,
} from '../../utils/deviceCapability';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { AVATAR_3D } from '../../utils/constants';

/**
 * Props for the Avatar3DDisplay component
 */
interface Avatar3DDisplayProps {
  /** Avatar customization configuration */
  avatarConfig?: AvatarConfig | Avatar3DConfig;
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

  const applyRenderMode = useCallback(
    (shouldUse3D: boolean) => {
      setUse3D((prev) => {
        if (prev !== shouldUse3D && onRenderModeChange) {
          onRenderModeChange(shouldUse3D ? '3d' : '2d');
        }
        return shouldUse3D;
      });
    },
    [onRenderModeChange]
  );

  const evaluateCapability = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      const { showLoading = false } = options;
      if (showLoading) {
        setLoading(true);
      }

      try {
        if (force2D) {
          applyRenderMode(false);
          return;
        }

        const [isCapable, preference] = await Promise.all([
          checkDeviceCapability(),
          get3DPreference(),
        ]);
        const shouldUse3D = preference !== null ? preference : isCapable;
        applyRenderMode(shouldUse3D);
      } catch (error) {
        console.error('Error checking 3D capability:', error);
        applyRenderMode(false);
      } finally {
        setLoading(false);
      }
    },
    [force2D, applyRenderMode]
  );

  // Check device capability and user preference on mount and when inputs change
  useEffect(() => {
    evaluateCapability({ showLoading: true });
  }, [evaluateCapability]);

  // Re-run capability check when user preference updates elsewhere
  useEffect(() => {
    const unsubscribe = add3DPreferenceListener(() => {
      evaluateCapability();
    });
    return unsubscribe;
  }, [evaluateCapability]);

  // Monitor performance when using 3D
  useEffect(() => {
    if (use3D && !performanceIssue) {
      let consecutiveLowFPS = 0;
      let performanceCheckInterval: ReturnType<typeof setInterval>;
      
      // Set up performance monitoring
      performanceMonitor.handleLowPerformance(() => {
        consecutiveLowFPS++;
        
        // Auto-downgrade after 5 consecutive low FPS readings
        if (consecutiveLowFPS >= AVATAR_3D.AUTO_DOWNGRADE_THRESHOLD) {
          console.warn('Auto-downgrading from 3D to 2D due to low performance');
          setPerformanceIssue(true);
          setUse3D(false);
          
          if (onRenderModeChange) {
            onRenderModeChange('2d');
          }
        }
      });
      
      // Check performance periodically and reset counter when performance is acceptable
      performanceCheckInterval = setInterval(() => {
        if (performanceMonitor.isPerformanceAcceptable()) {
          consecutiveLowFPS = 0;
        }
      }, AVATAR_3D.PERFORMANCE_CHECK_INTERVAL);
      
      performanceMonitor.startMonitoring();

      // Cleanup
      return () => {
        performanceMonitor.stopMonitoring();
        clearInterval(performanceCheckInterval);
      };
    }
  }, [use3D, performanceIssue, onRenderModeChange]);

  // Error handler for ErrorBoundary
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
    // Wrap ThreeAvatarView in ErrorBoundary
    return (
      <ErrorBoundary
        onError={handleRenderError}
        fallback={
          <AvatarDisplay
            avatarConfig={avatarConfig}
            muscleGroups={muscleGroups}
            size={size}
          />
        }
      >
        <ThreeAvatarView
          avatarConfig={avatarConfig}
          muscleGroups={muscleGroups}
          size={size}
          cameraAngle="front"
        />
      </ErrorBoundary>
    );
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
