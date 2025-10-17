import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Portal, Dialog, Text, Button, useTheme } from 'react-native-paper';
import AvatarDisplay from './AvatarDisplay';
import { MuscleGroups } from '../../types/models';
import { SPACING, MUSCLE_GROUP_LABELS } from '../../utils/constants';

/**
 * Props for AvatarEvolutionModal component
 */
interface AvatarEvolutionModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Function to call when dismissing the modal */
  onDismiss: () => void;
  /** Avatar level before evolution */
  previousLevel: number;
  /** New avatar level after evolution */
  newLevel: number;
  /** Current muscle group levels */
  muscleGroups: MuscleGroups;
  /** Array of muscle groups that increased */
  muscleGroupsGained: string[];
}

/**
 * AvatarEvolutionModal displays a celebration modal when the user's avatar levels up.
 * Shows the level progression, updated avatar visualization, and muscle groups that improved.
 * Includes a simple fade-in animation for the celebration effect.
 */
const AvatarEvolutionModal: React.FC<AvatarEvolutionModalProps> = ({
  visible,
  onDismiss,
  previousLevel,
  newLevel,
  muscleGroups,
  muscleGroupsGained,
}) => {
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    if (visible) {
      // Trigger animations when modal becomes visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal is hidden
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Celebration Header */}
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              🎉 Level Up! 🎉
            </Text>
            <Text variant="titleLarge" style={styles.levelText}>
              Level {previousLevel} → Level {newLevel}
            </Text>
          </View>

          {/* Avatar Display */}
          <View style={styles.avatarContainer}>
            <AvatarDisplay muscleGroups={muscleGroups} size={180} />
          </View>

          {/* Muscle Groups Gained */}
          {muscleGroupsGained.length > 0 && (
            <View style={styles.muscleGainsContainer}>
              <Text variant="titleMedium" style={styles.muscleGainsTitle}>
                Muscle Groups Improved:
              </Text>
              <View style={styles.muscleGainsList}>
                {muscleGroupsGained.map((muscle) => (
                  <View key={muscle} style={styles.muscleGainItem}>
                    <Text variant="bodyLarge" style={styles.muscleGainText}>
                      💪 {MUSCLE_GROUP_LABELS[muscle as keyof typeof MUSCLE_GROUP_LABELS] || muscle}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Motivational Message */}
          <Text variant="bodyLarge" style={styles.motivationalText}>
            Great progress! Keep pushing your limits and watch your avatar grow stronger! 💪
          </Text>

          {/* Continue Button */}
          <Button
            mode="contained"
            onPress={onDismiss}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Continue
          </Button>
        </Animated.View>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: 'white',
    borderRadius: 16,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: SPACING.sm,
  },
  levelText: {
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  muscleGainsContainer: {
    marginBottom: SPACING.lg,
  },
  muscleGainsTitle: {
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  muscleGainsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  muscleGainItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    margin: SPACING.xs,
  },
  muscleGainText: {
    fontWeight: '500',
  },
  motivationalText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: SPACING.lg,
  },
  button: {
    marginTop: SPACING.sm,
  },
  buttonContent: {
    paddingVertical: SPACING.xs,
  },
});

export default AvatarEvolutionModal;
