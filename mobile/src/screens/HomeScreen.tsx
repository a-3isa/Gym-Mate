import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

const HomeScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headlineMedium" style={[styles.title, { color: colors.onSurface }]}>
        Welcome to GymMate
      </Text>
      <Text style={[styles.subtitle, { color: colors.onSurface }]}>
        Track your workouts, join sessions with friends, and stay motivated on your fitness journey.
      </Text>
      <Button mode="contained" onPress={() => {}}>
        Start a Workout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  title: {
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center'
  }
});

export default HomeScreen;
