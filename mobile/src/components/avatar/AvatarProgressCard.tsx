import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, useTheme } from 'react-native-paper';
import { AvatarState } from '../../types/models';
import { SPACING, MUSCLE_GROUP_LABELS } from '../../utils/constants';

/**
 * Props for AvatarProgressCard component
 */
interface AvatarProgressCardProps {
  /** Avatar state containing level, XP, and muscle groups */
  avatarState: AvatarState | null;
  /** Compact mode shows only essential info */
  compact?: boolean;
}

/**
 * Calculates XP required for a specific level (mirrors backend implementation)
 * @param level - Target level
 * @returns XP threshold for that level
 */
const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level === 2) return 500;

  // Exponential growth formula: 500 * (level ^ 1.5)
  return Math.floor(500 * Math.pow(level, 1.5));
};

/**
 * AvatarProgressCard displays avatar progression metrics and workout statistics.
 * Shows level, XP progress, current streak, total workouts, and muscle group breakdown.
 * In compact mode, displays only level, XP bar, and streak.
 */
const AvatarProgressCard: React.FC<AvatarProgressCardProps> = ({
  avatarState,
  compact = false,
}) => {
  const theme = useTheme();

  if (!avatarState) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium">Loading avatar data...</Text>
        </Card.Content>
      </Card>
    );
  }

  // Calculate progress within current level
  const currentLevelStartXP = getXPForLevel(avatarState.level);
  const nextLevelXP = getXPForLevel(avatarState.level + 1);
  const xpProgress = avatarState.xpToNextLevel > 0
    ? (avatarState.xp - currentLevelStartXP) / (nextLevelXP - currentLevelStartXP)
    : 1;

  if (compact) {
    // Compact view for small cards
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.compactContainer}>
            {/* Level */}
            <View style={styles.levelContainer}>
              <Text variant="titleMedium" style={styles.levelLabel}>
                Level {avatarState.level}
              </Text>
            </View>

            {/* XP Progress */}
            <View style={styles.xpContainer}>
              <Text variant="bodySmall" style={styles.xpLabel}>
                {avatarState.xpToNextLevel > 0 
                  ? `XP: ${avatarState.xp - currentLevelStartXP} / ${nextLevelXP - currentLevelStartXP}`
                  : `Max Level Reached (${avatarState.xp} XP)`
                }
              </Text>
              <ProgressBar
                progress={xpProgress}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>

            {/* Streak */}
            {avatarState.currentStreak > 0 && (
              <View style={styles.streakContainer}>
                <Text variant="bodyMedium">
                  🔥 {avatarState.currentStreak} day streak
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Full view for detailed stats
  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header with Level and Streak */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.levelText}>
            Level {avatarState.level}
          </Text>
          {avatarState.currentStreak > 0 && (
            <Text variant="titleMedium" style={styles.streakText}>
              🔥 {avatarState.currentStreak} day streak
            </Text>
          )}
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text variant="bodyMedium" style={styles.xpLabel}>
              Experience Points
            </Text>
            <Text variant="bodySmall" style={styles.xpValue}>
              {avatarState.xpToNextLevel > 0 
                ? `${avatarState.xp - currentLevelStartXP} / ${nextLevelXP - currentLevelStartXP}`
                : `Max Level (${avatarState.xp} XP)`
              }
            </Text>
          </View>
          <ProgressBar
            progress={xpProgress}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text variant="bodySmall" style={styles.xpToNext}>
            {avatarState.xpToNextLevel > 0 
              ? `${avatarState.xpToNextLevel} XP to next level`
              : 'Maximum level achieved!'
            }
          </Text>
        </View>

        {/* Workout Stats */}
        <View style={styles.statsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Workout Statistics
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {avatarState.totalWorkouts}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Workouts
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {avatarState.currentStreak}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Current Streak
              </Text>
            </View>
          </View>
        </View>

        {/* Muscle Groups */}
        <View style={styles.muscleSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Muscle Development
          </Text>
          <View style={styles.muscleList}>
            {Object.entries(avatarState.muscleGroups).map(([muscle, level]) => (
              <View key={muscle} style={styles.muscleItem}>
                <View style={styles.muscleHeader}>
                  <Text variant="bodyMedium" style={styles.muscleLabel}>
                    {MUSCLE_GROUP_LABELS[muscle as keyof typeof MUSCLE_GROUP_LABELS]}
                  </Text>
                  <Text variant="bodySmall" style={styles.muscleLevel}>
                    Lv. {level}
                  </Text>
                </View>
                <ProgressBar
                  progress={level / 10}
                  color={theme.colors.secondary}
                  style={styles.muscleProgress}
                />
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: SPACING.sm,
    elevation: 2,
  },
  compactContainer: {
    gap: SPACING.sm,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelLabel: {
    fontWeight: '600',
  },
  xpContainer: {
    gap: SPACING.xs,
  },
  xpLabel: {
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  streakContainer: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  levelText: {
    fontWeight: 'bold',
  },
  streakText: {
    color: '#F97316',
  },
  xpSection: {
    marginBottom: SPACING.lg,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  xpValue: {
    color: '#6B7280',
  },
  xpToNext: {
    color: '#9CA3AF',
    marginTop: SPACING.xs,
  },
  statsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6B7280',
    marginTop: SPACING.xs,
  },
  muscleSection: {
    marginTop: SPACING.sm,
  },
  muscleList: {
    gap: SPACING.md,
  },
  muscleItem: {
    gap: SPACING.xs,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muscleLabel: {
    fontWeight: '500',
  },
  muscleLevel: {
    color: '#6B7280',
  },
  muscleProgress: {
    height: 4,
    borderRadius: 2,
  },
});

export default AvatarProgressCard;
