import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ScrollView,
  Alert 
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  Chip, 
  ActivityIndicator, 
  Divider, 
  Card, 
  useTheme,
  Button 
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExercisesStackNavigationProp } from '../navigation/types';
import { getAllExercises } from '../services/api/exercise.service';
import { Exercise } from '../types/models';
import { SPACING, EXERCISE_CATEGORIES } from '../utils/constants';

/**
 * Exercise library screen with category filtering and search
 * Displays all exercises with filtering by category and text search
 */
const ExercisesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<ExercisesStackNavigationProp>();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch exercises on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [])
  );

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const data = await getAllExercises();
      setExercises(data);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to load exercises',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null); // Deselect to show all
    } else {
      setSelectedCategory(category);
    }
  };

  // Filter exercises based on category and search query
  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.category.toLowerCase().includes(query) ||
        ex.muscleGroups.some(muscle => muscle.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [exercises, selectedCategory, searchQuery]);

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
      activeOpacity={0.7}
    >
      <Card style={styles.exerciseCard}>
        <Card.Title
          title={item.name}
          subtitle={`${item.category.charAt(0).toUpperCase() + item.category.slice(1)} • ${item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}`}
          right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />}
        />
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyList = () => {
    const hasFilters = selectedCategory || searchQuery.trim();
    
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          {hasFilters ? 'No exercises found' : 'No exercises available'}
        </Text>
        {hasFilters && (
          <Button
            mode="outlined"
            onPress={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            style={styles.clearButton}
          >
            Clear filters
          </Button>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={[styles.header, { color: theme.colors.onSurface }]}>
        Exercise Library
      </Text>
      
      <Searchbar
        placeholder="Search exercises, muscles, or categories"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
      />

      {/* Category Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chipScrollView}
        contentContainerStyle={styles.chipContainer}
      >
        <Chip
          mode="outlined"
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
          style={styles.chip}
        >
          All
        </Chip>
        {EXERCISE_CATEGORIES.map((category) => (
          <Chip
            key={category.key}
            mode="outlined"
            selected={selectedCategory === category.key}
            onPress={() => handleCategoryPress(category.key)}
            icon={() => (
              <MaterialCommunityIcons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.key ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            )}
            style={styles.chip}
          >
            {category.label}
          </Chip>
        ))}
      </ScrollView>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  searchbar: {
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
    elevation: 0,
  },
  chipScrollView: {
    maxHeight: 50,
    marginBottom: SPACING.md,
  },
  chipContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  chip: {
    marginRight: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  exerciseCard: {
    marginVertical: SPACING.xs,
    elevation: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl * 2,
  },
  emptyText: {
    marginBottom: SPACING.md,
    opacity: 0.7,
  },
  clearButton: {
    marginTop: SPACING.sm,
  },
});

export default ExercisesScreen;
