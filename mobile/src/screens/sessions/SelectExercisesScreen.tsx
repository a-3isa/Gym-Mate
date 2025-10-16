import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Card, Chip, Button, TextInput, ActivityIndicator, Divider, IconButton, useTheme, Text, Checkbox, Searchbar } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllExercises } from '../../services/api/exercise.service';
import { createSession } from '../../services/api/session.service';
import { Exercise } from '../../types/models';
import { SPACING, EXERCISE_CATEGORIES } from '../../utils/constants';
import { SessionsStackNavigationProp, SessionsStackRouteProp } from '../../navigation/types';

interface SelectedExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
}

/**
 * SelectExercisesScreen - Exercise selection for collaborative workout
 */
const SelectExercisesScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<SessionsStackNavigationProp>();
  const route = useRoute<SessionsStackRouteProp<'SelectExercises'>>();
  const { friendUid, friendName } = route.params;
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [creating, setCreating] = useState(false);

  /**
   * Fetches exercises on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      const fetchExercises = async () => {
        try {
          const data = await getAllExercises();
          setExercises(data);
          setFilteredExercises(data);
        } catch (error) {
          Alert.alert('Error', 'Failed to fetch exercises');
          console.error('Error fetching exercises:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchExercises();
    }, [])
  );

  /**
   * Filters exercises based on category and search query
   */
  useMemo(() => {
    let filtered = exercises;
    
    if (selectedCategory) {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredExercises(filtered);
  }, [selectedCategory, searchQuery, exercises]);

  /**
   * Toggles category filter
   */
  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(current => current === category ? null : category);
  }, []);

  /**
   * Handles exercise selection
   */
  const handleExercisePress = useCallback((exercise: Exercise) => {
    setSelectedExercises(current => {
      const exists = current.find(ex => ex.exerciseId === exercise.id);
      if (exists) {
        return current.filter(ex => ex.exerciseId !== exercise.id);
      } else {
        return [...current, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          targetSets: 3, // Default to 3 sets
        }];
      }
    });
  }, []);

  /**
   * Updates target sets for an exercise
   */
  const handleSetTargetSets = useCallback((exerciseId: string, targetSets: string) => {
    const sets = parseInt(targetSets, 10);
    if (isNaN(sets) || sets < 1 || sets > 10) return;
    
    setSelectedExercises(current =>
      current.map(ex =>
        ex.exerciseId === exerciseId
          ? { ...ex, targetSets: sets }
          : ex
      )
    );
  }, []);

  /**
   * Removes a selected exercise by ID
   */
  const removeSelectedExercise = useCallback((exerciseId: string) => {
    setSelectedExercises(current => current.filter(ex => ex.exerciseId !== exerciseId));
  }, []);

  /**
   * Creates the session
   */
  const handleCreateSession = useCallback(async () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Select Exercises', 'Please select at least one exercise');
      return;
    }
    
    setCreating(true);
    try {
      await createSession(friendUid, selectedExercises);
      Alert.alert('Success', 'Session created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Sessions') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create session');
      console.error('Error creating session:', error);
    } finally {
      setCreating(false);
    }
  }, [friendUid, selectedExercises, navigation]);

  /**
   * Renders an exercise card
   */
  const renderExercise = useCallback(({ item }: { item: Exercise }) => {
    const isSelected = selectedExercises.some(ex => ex.exerciseId === item.id);
    
    return (
      <Card style={[styles.exerciseCard, isSelected && { backgroundColor: theme.colors.primaryContainer }]}>
        <Card.Content>
          <View style={styles.exerciseHeader}>
            <Text variant="titleMedium">{item.name}</Text>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => handleExercisePress(item)}
            />
          </View>
          <Chip compact mode="flat" style={styles.categoryChip}>
            {item.category}
          </Chip>
        </Card.Content>
      </Card>
    );
  }, [selectedExercises, handleExercisePress, theme.colors.primaryContainer]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="bodyLarge" style={styles.header}>
        Select exercises for workout with {friendName}
      </Text>
      
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chipContainer}
      >
        {EXERCISE_CATEGORIES.map(category => (
          <Chip
            key={category.key}
            mode={selectedCategory === category.key ? 'flat' : 'outlined'}
            onPress={() => handleCategoryPress(category.key)}
            style={styles.chip}
          >
            {category.label}
          </Chip>
        ))}
      </ScrollView>
      
      {/* Search Bar */}
      <Searchbar
        placeholder="Search exercises"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {/* Exercises List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => selectedExercises.length > 0 ? (
          <View style={styles.selectedSection}>
            <Text variant="titleMedium" style={styles.selectedTitle}>
              Selected Exercises ({selectedExercises.length})
            </Text>
            {selectedExercises.map(exercise => (
              <View key={exercise.exerciseId} style={styles.selectedItem}>
                <View style={styles.selectedItemInfo}>
                  <Text variant="bodyLarge">{exercise.exerciseName}</Text>
                  <View style={styles.setsInput}>
                    <Text>Sets:</Text>
                    <TextInput
                      value={exercise.targetSets.toString()}
                      onChangeText={(text) => handleSetTargetSets(exercise.exerciseId, text)}
                      keyboardType="numeric"
                      mode="outlined"
                      dense
                      style={styles.setsTextInput}
                    />
                  </View>
                </View>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => removeSelectedExercise(exercise.exerciseId)}
                />
              </View>
            ))}
          </View>
        ) : null}
      />
      
      <Button
        mode="contained"
        onPress={handleCreateSession}
        disabled={selectedExercises.length === 0 || creating}
        loading={creating}
        style={styles.createButton}
      >
        Create Session
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.md,
  },
  chipContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  chip: {
    marginRight: SPACING.sm,
  },
  searchbar: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  exerciseCard: {
    marginBottom: SPACING.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  selectedSection: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 8,
  },
  selectedTitle: {
    marginBottom: SPACING.md,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  selectedItemInfo: {
    flex: 1,
  },
  setsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  setsTextInput: {
    width: 60,
  },
  createButton: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
});

export default SelectExercisesScreen;
