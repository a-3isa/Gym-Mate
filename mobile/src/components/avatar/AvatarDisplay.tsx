import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Rect, Path } from 'react-native-svg';
import { useTheme } from 'react-native-paper';
import { MuscleGroups } from '../../types/models';
import { AVATAR_COLORS, SPACING } from '../../utils/constants';

/**
 * Props for AvatarDisplay component
 */
interface AvatarDisplayProps {
  /** Muscle group levels (1-10) for each body part */
  muscleGroups: MuscleGroups;
  /** Size of the avatar display (width and height) */
  size?: number;
  /** Additional styles for the container */
  style?: ViewStyle;
}

/**
 * AvatarDisplay component renders an SVG-based avatar that visually represents
 * muscle group development. Body parts scale and change color based on muscle levels.
 * 
 * Scaling logic:
 * - Level 1: 0.5 scale (50% of base size)
 * - Level 10: 1.5 scale (150% of base size)
 * - Linear interpolation between levels
 * 
 * Color logic:
 * - Levels 1-3: Light colors (beginner)
 * - Levels 4-6: Medium colors (intermediate)
 * - Levels 7-10: Dark colors (advanced)
 */
const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  muscleGroups,
  size = 200,
  style,
}) => {
  const theme = useTheme();

  // Helper function to get scale factor based on muscle level
  const getScale = (level: number): number => {
    // Scale from 0.5 (level 1) to 1.5 (level 10)
    return 0.5 + (level - 1) * (1 / 9);
  };

  // Helper function to get color based on muscle level
  const getColor = (level: number): string => {
    const colorKey = `level${Math.min(10, Math.max(1, level))}` as keyof typeof AVATAR_COLORS;
    return AVATAR_COLORS[colorKey];
  };

  const headScale = 1; // Head doesn't change
  const torsoScale = getScale(muscleGroups.core);
  const armScale = getScale(muscleGroups.arms);
  const shoulderScale = getScale(muscleGroups.shoulders);
  const chestScale = getScale(muscleGroups.chest);
  const legScale = getScale(muscleGroups.legs);
  const backScale = getScale(muscleGroups.back);

  // Calculate dimensions based on size
  const viewBox = `0 0 ${size} ${size}`;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={viewBox}>
        {/* Head - always the same */}
        <Circle
          cx={centerX}
          cy={size * 0.15}
          r={size * 0.08}
          fill={theme.colors.onSurfaceVariant}
        />

        {/* Torso (core) */}
        <Rect
          x={centerX - (size * 0.15 * torsoScale)}
          y={size * 0.25}
          width={size * 0.3 * torsoScale}
          height={size * 0.35}
          rx={size * 0.02}
          fill={getColor(muscleGroups.core)}
        />

        {/* Chest overlay (pectoral definition) */}
        <Path
          d={`
            M ${centerX - (size * 0.12 * chestScale)} ${size * 0.28}
            Q ${centerX} ${size * 0.32 * chestScale} ${centerX + (size * 0.12 * chestScale)} ${size * 0.28}
            L ${centerX + (size * 0.1 * chestScale)} ${size * 0.35}
            Q ${centerX} ${size * 0.37} ${centerX - (size * 0.1 * chestScale)} ${size * 0.35}
            Z
          `}
          fill={getColor(muscleGroups.chest)}
          opacity={0.7}
        />

        {/* Shoulders */}
        <Ellipse
          cx={centerX - (size * 0.18)}
          cy={size * 0.28}
          rx={size * 0.06 * shoulderScale}
          ry={size * 0.05 * shoulderScale}
          fill={getColor(muscleGroups.shoulders)}
        />
        <Ellipse
          cx={centerX + (size * 0.18)}
          cy={size * 0.28}
          rx={size * 0.06 * shoulderScale}
          ry={size * 0.05 * shoulderScale}
          fill={getColor(muscleGroups.shoulders)}
        />

        {/* Arms */}
        <Rect
          x={centerX - (size * 0.22)}
          y={size * 0.32}
          width={size * 0.04 * armScale}
          height={size * 0.22}
          rx={size * 0.02}
          fill={getColor(muscleGroups.arms)}
        />
        <Rect
          x={centerX + (size * 0.18)}
          y={size * 0.32}
          width={size * 0.04 * armScale}
          height={size * 0.22}
          rx={size * 0.02}
          fill={getColor(muscleGroups.arms)}
        />

        {/* Back indicator (shows as width variation) */}
        <Rect
          x={centerX - (size * 0.16 * backScale)}
          y={size * 0.26}
          width={size * 0.32 * backScale}
          height={size * 0.02}
          fill={getColor(muscleGroups.back)}
          opacity={0.5}
        />

        {/* Legs */}
        <Rect
          x={centerX - (size * 0.12)}
          y={size * 0.58}
          width={size * 0.08 * legScale}
          height={size * 0.3 * legScale}
          rx={size * 0.02}
          fill={getColor(muscleGroups.legs)}
        />
        <Rect
          x={centerX + (size * 0.04)}
          y={size * 0.58}
          width={size * 0.08 * legScale}
          height={size * 0.3 * legScale}
          rx={size * 0.02}
          fill={getColor(muscleGroups.legs)}
        />

        {/* Core definition lines (abs) based on core level */}
        {muscleGroups.core >= 4 && (
          <Path
            d={`M ${centerX - size * 0.08} ${size * 0.35} L ${centerX + size * 0.08} ${size * 0.35}`}
            stroke={theme.colors.onSurfaceVariant}
            strokeWidth="1"
            opacity={0.3}
          />
        )}
        {muscleGroups.core >= 6 && (
          <Path
            d={`M ${centerX - size * 0.08} ${size * 0.42} L ${centerX + size * 0.08} ${size * 0.42}`}
            stroke={theme.colors.onSurfaceVariant}
            strokeWidth="1"
            opacity={0.3}
          />
        )}
        {muscleGroups.core >= 8 && (
          <Path
            d={`M ${centerX - size * 0.08} ${size * 0.49} L ${centerX + size * 0.08} ${size * 0.49}`}
            stroke={theme.colors.onSurfaceVariant}
            strokeWidth="1"
            opacity={0.3}
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AvatarDisplay;
