import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { SPACING, COLORS } from '../../utils/constants';

interface Props {
  timerType: 'rest' | 'workout';
  remainingSeconds: number;
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const formatTime = (total: number) => {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

const TimerDisplay: React.FC<Props> = ({
  timerType,
  remainingSeconds,
  isActive,
  onStart,
  onStop,
  onReset,
}) => {
  const theme = useTheme();
  const color = timerType === 'rest' ? COLORS.accent : COLORS.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text variant="titleMedium" style={{ marginBottom: SPACING.xs }}>
        {timerType === 'rest' ? 'Rest Timer' : 'Workout Timer'}
      </Text>
      <Text variant="displaySmall" style={{ color, marginBottom: SPACING.sm }}>
        {formatTime(remainingSeconds)}
      </Text>
      <View style={styles.row}>
        {isActive ? (
          <Button mode="contained" onPress={onStop} style={styles.button}>
            Stop
          </Button>
        ) : (
          <Button mode="contained" onPress={onStart} style={styles.button}>
            Start
          </Button>
        )}
        <Button mode="outlined" onPress={onReset} style={styles.button}>
          Reset
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});

export default TimerDisplay;


