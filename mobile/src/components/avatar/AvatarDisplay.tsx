import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Rect, Path } from 'react-native-svg';
import { useTheme } from 'react-native-paper';
import { MuscleGroups, AvatarConfig } from '../../types/models';
import { AVATAR_COLORS, SPACING } from '../../utils/constants';

/**
 * Props for AvatarDisplay component
 */
interface AvatarDisplayProps {
  /** Muscle group levels (1-10) for each body part */
  muscleGroups: MuscleGroups;
  /** Avatar visual customization configuration */
  avatarConfig?: AvatarConfig;
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
  avatarConfig,
  size = 200,
  style,
}) => {
  const theme = useTheme();

  // Default avatar configuration if not provided
  const defaultConfig: AvatarConfig = {
    bodyType: 'athletic',
    skinTone: theme.colors.onSurfaceVariant,
    hairStyle: 'short',
    hairColor: '#4A3728',
    clothingStyle: 'tshirt',
    clothingColor: '#3B82F6',
  };

  const config = { ...defaultConfig, ...avatarConfig };

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

  // Get body type scale multiplier for width
  const getBodyTypeScale = (bodyType?: string): number => {
    switch (bodyType) {
      case 'slim': return 0.9;
      case 'athletic': return 1.0;
      case 'muscular': return 1.15;
      case 'heavy': return 1.25;
      default: return 1.0;
    }
  };

  // Render hair based on style
  const renderHair = (centerX: number, centerY: number, size: number, hairStyle?: string, hairColor?: string) => {
    const color = hairColor || '#4A3728';
    const headY = size * 0.15;
    
    switch (hairStyle) {
      case 'bald':
        return null;
      case 'short':
        return (
          <Ellipse
            cx={centerX}
            cy={headY - size * 0.04}
            rx={size * 0.07}
            ry={size * 0.03}
            fill={color}
          />
        );
      case 'medium':
        return (
          <>
            <Ellipse
              cx={centerX}
              cy={headY - size * 0.04}
              rx={size * 0.08}
              ry={size * 0.04}
              fill={color}
            />
            <Path
              d={`M ${centerX - size * 0.08} ${headY} Q ${centerX - size * 0.09} ${headY + size * 0.02} ${centerX - size * 0.07} ${headY + size * 0.04}`}
              fill={color}
            />
            <Path
              d={`M ${centerX + size * 0.08} ${headY} Q ${centerX + size * 0.09} ${headY + size * 0.02} ${centerX + size * 0.07} ${headY + size * 0.04}`}
              fill={color}
            />
          </>
        );
      case 'long':
        return (
          <>
            <Ellipse
              cx={centerX}
              cy={headY - size * 0.04}
              rx={size * 0.09}
              ry={size * 0.05}
              fill={color}
            />
            <Path
              d={`M ${centerX - size * 0.09} ${headY} L ${centerX - size * 0.08} ${headY + size * 0.08} Q ${centerX - size * 0.07} ${headY + size * 0.1} ${centerX - size * 0.05} ${headY + size * 0.09}`}
              fill={color}
            />
            <Path
              d={`M ${centerX + size * 0.09} ${headY} L ${centerX + size * 0.08} ${headY + size * 0.08} Q ${centerX + size * 0.07} ${headY + size * 0.1} ${centerX + size * 0.05} ${headY + size * 0.09}`}
              fill={color}
            />
          </>
        );
      case 'curly':
        return (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <Circle
                key={`curly-${i}`}
                cx={centerX + (i - 2) * size * 0.03}
                cy={headY - size * 0.045 + (i % 2) * size * 0.01}
                r={size * 0.02}
                fill={color}
              />
            ))}
          </>
        );
      case 'buzz':
        return (
          <Ellipse
            cx={centerX}
            cy={headY - size * 0.03}
            rx={size * 0.06}
            ry={size * 0.02}
            fill={color}
          />
        );
      default:
        return null;
    }
  };

  // Render clothing based on style
  const renderClothing = (centerX: number, centerY: number, size: number, torsoScale: number, clothingStyle?: string, clothingColor?: string) => {
    const color = clothingColor || '#3B82F6';
    const bodyTypeMultiplier = getBodyTypeScale(config.bodyType);
    
    switch (clothingStyle) {
      case 'tank':
        return (
          <Path
            d={`
              M ${centerX - (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.27}
              L ${centerX - (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.58}
              L ${centerX + (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.58}
              L ${centerX + (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.27}
              L ${centerX + (size * 0.05 * torsoScale * bodyTypeMultiplier)} ${size * 0.27}
              L ${centerX + (size * 0.05 * torsoScale * bodyTypeMultiplier)} ${size * 0.25}
              L ${centerX - (size * 0.05 * torsoScale * bodyTypeMultiplier)} ${size * 0.25}
              L ${centerX - (size * 0.05 * torsoScale * bodyTypeMultiplier)} ${size * 0.27}
              Z
            `}
            fill={color}
            opacity={0.9}
          />
        );
      case 'tshirt':
        const half = size * 0.14 * torsoScale * bodyTypeMultiplier;
        const sleeveWidth = size * 0.07;
        const inset = size * 0.01;
        return (
          <>
            <Rect
              x={centerX - half}
              y={size * 0.26}
              width={size * 0.28 * torsoScale * bodyTypeMultiplier}
              height={size * 0.32}
              rx={size * 0.01}
              fill={color}
              opacity={0.9}
            />
            <Rect
              x={centerX - half - sleeveWidth + inset}
              y={size * 0.28}
              width={sleeveWidth}
              height={size * 0.15}
              rx={size * 0.01}
              fill={color}
              opacity={0.9}
            />
            <Rect
              x={centerX + half - inset}
              y={size * 0.28}
              width={sleeveWidth}
              height={size * 0.15}
              rx={size * 0.01}
              fill={color}
              opacity={0.9}
            />
          </>
        );
      case 'hoodie':
        const torsoHalf = size * 0.14 * torsoScale * bodyTypeMultiplier;
        const hoodWidth = torsoHalf * 0.7; // Hood width proportional to torso
        return (
          <>
            <Path
              d={`
                M ${centerX - hoodWidth} ${size * 0.12}
                Q ${centerX} ${size * 0.08} ${centerX + hoodWidth} ${size * 0.12}
                L ${centerX + hoodWidth * 0.8} ${size * 0.22}
                L ${centerX - hoodWidth * 0.8} ${size * 0.22}
                Z
              `}
              fill={color}
              opacity={0.8}
            />
            <Rect
              x={centerX - torsoHalf}
              y={size * 0.26}
              width={size * 0.28 * torsoScale * bodyTypeMultiplier}
              height={size * 0.32}
              rx={size * 0.01}
              fill={color}
              opacity={0.9}
            />
          </>
        );
      case 'sports-bra':
        return (
          <Path
            d={`
              M ${centerX - (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.27}
              L ${centerX - (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.38}
              Q ${centerX} ${size * 0.4} ${centerX + (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.38}
              L ${centerX + (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.27}
              Q ${centerX} ${size * 0.29} ${centerX - (size * 0.13 * torsoScale * bodyTypeMultiplier)} ${size * 0.27}
              Z
            `}
            fill={color}
            opacity={0.9}
          />
        );
      case 'compression':
        return (
          <Rect
            x={centerX - (size * 0.13 * torsoScale * bodyTypeMultiplier)}
            y={size * 0.26}
            width={size * 0.26 * torsoScale * bodyTypeMultiplier}
            height={size * 0.32}
            rx={size * 0.005}
            fill={color}
            opacity={0.95}
          />
        );
      default:
        return null;
    }
  };

  const bodyTypeMultiplier = getBodyTypeScale(config.bodyType);
  const headScale = 1; // Head doesn't change
  const torsoScale = getScale(muscleGroups.core) * bodyTypeMultiplier;
  const armScale = getScale(muscleGroups.arms) * bodyTypeMultiplier;
  const shoulderScale = getScale(muscleGroups.shoulders) * bodyTypeMultiplier;
  const chestScale = getScale(muscleGroups.chest) * bodyTypeMultiplier;
  const legScale = getScale(muscleGroups.legs) * bodyTypeMultiplier;
  const backScale = getScale(muscleGroups.back) * bodyTypeMultiplier;

  // Calculate dimensions based on size
  const viewBox = `0 0 ${size} ${size}`;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={viewBox}>
        {/* Head - uses skin tone from config */}
        <Circle
          cx={centerX}
          cy={size * 0.15}
          r={size * 0.08}
          fill={config.skinTone || theme.colors.onSurfaceVariant}
        />

        {/* Hair */}
        {renderHair(centerX, centerY, size, config.hairStyle, config.hairColor)}

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
          fill={config.skinTone || theme.colors.onSurfaceVariant}
        />
        <Ellipse
          cx={centerX - (size * 0.18)}
          cy={size * 0.28}
          rx={size * 0.06 * shoulderScale}
          ry={size * 0.05 * shoulderScale}
          fill={getColor(muscleGroups.shoulders)}
          opacity={0.45}
        />
        <Ellipse
          cx={centerX + (size * 0.18)}
          cy={size * 0.28}
          rx={size * 0.06 * shoulderScale}
          ry={size * 0.05 * shoulderScale}
          fill={config.skinTone || theme.colors.onSurfaceVariant}
        />
        <Ellipse
          cx={centerX + (size * 0.18)}
          cy={size * 0.28}
          rx={size * 0.06 * shoulderScale}
          ry={size * 0.05 * shoulderScale}
          fill={getColor(muscleGroups.shoulders)}
          opacity={0.45}
        />

        {/* Arms */}
        <Rect
          x={centerX - (size * 0.22) - (size * 0.04 * armScale - size * 0.04) / 2}
          y={size * 0.32}
          width={size * 0.04 * armScale}
          height={size * 0.22}
          rx={size * 0.02}
          fill={config.skinTone || theme.colors.onSurfaceVariant}
        />
        <Rect
          x={centerX - (size * 0.22) - (size * 0.04 * armScale - size * 0.04) / 2}
          y={size * 0.32}
          width={size * 0.04 * armScale}
          height={size * 0.22}
          rx={size * 0.02}
          fill={getColor(muscleGroups.arms)}
          opacity={0.45}
        />
        <Rect
          x={centerX + (size * 0.18) - (size * 0.04 * armScale - size * 0.04) / 2}
          y={size * 0.32}
          width={size * 0.04 * armScale}
          height={size * 0.22}
          rx={size * 0.02}
          fill={config.skinTone || theme.colors.onSurfaceVariant}
        />
        <Rect
          x={centerX + (size * 0.18) - (size * 0.04 * armScale - size * 0.04) / 2}
          y={size * 0.32}
          width={size * 0.04 * armScale}
          height={size * 0.22}
          rx={size * 0.02}
          fill={getColor(muscleGroups.arms)}
          opacity={0.45}
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
          x={centerX - (size * 0.08 * legScale) - (size * 0.02)}
          y={size * 0.58}
          width={size * 0.08 * legScale}
          height={size * 0.3 * legScale}
          rx={size * 0.02}
          fill={config.skinTone || theme.colors.onSurfaceVariant}
        />
        <Rect
          x={centerX - (size * 0.08 * legScale) - (size * 0.02)}
          y={size * 0.58}
          width={size * 0.08 * legScale}
          height={size * 0.3 * legScale}
          rx={size * 0.02}
          fill={getColor(muscleGroups.legs)}
          opacity={0.45}
        />
        <Rect
          x={centerX + (size * 0.02)}
          y={size * 0.58}
          width={size * 0.08 * legScale}
          height={size * 0.3 * legScale}
          rx={size * 0.02}
          fill={config.skinTone || theme.colors.onSurfaceVariant}
        />
        <Rect
          x={centerX + (size * 0.02)}
          y={size * 0.58}
          width={size * 0.08 * legScale}
          height={size * 0.3 * legScale}
          rx={size * 0.02}
          fill={getColor(muscleGroups.legs)}
          opacity={0.45}
        />

        {/* Clothing overlay */}
        {renderClothing(centerX, centerY, size, getScale(muscleGroups.core), config.clothingStyle, config.clothingColor)}

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
