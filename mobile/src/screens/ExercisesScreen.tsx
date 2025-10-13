import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Searchbar, useTheme } from 'react-native-paper';

const ExercisesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text variant="headlineSmall" style={[styles.header, { color: colors.onSurface }]}> 
        Exercise Library
      </Text>
      <Searchbar
        placeholder="Search exercises"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
      />
      <Text style={[styles.placeholder, { color: colors.onSurfaceVariant }]}>
        Exercises will appear here in future updates.
      </Text>
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
  searchbar: {
    marginBottom: 24
  },
  placeholder: {
    marginTop: 8
  }
});

export default ExercisesScreen;
