import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';

const SessionsScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text variant="headlineSmall" style={[styles.header, { color: colors.onSurface }] }>
        Workout Sessions
      </Text>
      <Text style={[styles.placeholder, { color: colors.onSurfaceVariant }]}>
        No active sessions. Create one to get started!
      </Text>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        label="New Session"
        color={colors.onPrimary}
        theme={{ colors: { primary: colors.primary } }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24
  },
  header: {
    marginBottom: 16
  },
  placeholder: {
    marginBottom: 24
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16
  }
});

export default SessionsScreen;
