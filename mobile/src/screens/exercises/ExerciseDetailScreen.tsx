import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  ActivityIndicator, 
  Divider, 
  useTheme 
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { getExerciseById } from '../../services/api/exercise.service';
import { Exercise } from '../../types/models';
import { ExercisesStackParamList } from '../../navigation/types';
import { SPACING, COLORS } from '../../utils/constants';

type ExerciseDetailRouteProp = RouteProp<ExercisesStackParamList, 'ExerciseDetail'>;

/**
 * Screen for displaying detailed exercise information
 * Shows name, category, difficulty, muscle groups, equipment, and instructions
 */
const ExerciseDetailScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<ExerciseDetailRouteProp>();
  const navigation = useNavigation();
  const { exerciseId } = route.params;
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId]);

  const fetchExerciseDetails = async () => {
    try {
      setLoading(true);
      const data = await getExerciseById(exerciseId);
      setExercise(data);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to load exercise details',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      chest: COLORS.primary,
      back: COLORS.secondary,
      legs: COLORS.accent,
      shoulders: '#FF9800',
      arms: '#9C27B0',
      core: '#4CAF50',
      cardio: '#F44336',
    };
    return colors[category] || COLORS.primary;
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      beginner: '#4CAF50',
      intermediate: '#FF9800',
      advanced: COLORS.error,
    };
    return colors[difficulty] || COLORS.primary;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge">Exercise not found</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <Card.Content>
          {/* Exercise Name */}
          <Text variant="headlineMedium" style={styles.title}>
            {exercise.name}
          </Text>
          
          {/* Category and Difficulty Badges */}
          <View style={styles.chipContainer}>
            <Chip 
              mode="outlined" 
              style={[styles.chip, { borderColor: getCategoryColor(exercise.category) }]}
              textStyle={{ color: getCategoryColor(exercise.category) }}
            >
              {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
            </Chip>
            <Chip 
              mode="outlined"
              style={[styles.chip, { borderColor: getDifficultyColor(exercise.difficulty) }]}
              textStyle={{ color: getDifficultyColor(exercise.difficulty) }}
            >
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          {/* Muscle Groups */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Muscle Groups
            </Text>
            <View style={styles.muscleGroupContainer}>
              {exercise.muscleGroups.map((muscle, index) => (
                <Chip 
                  key={index} 
                  mode="flat" 
                  style={styles.muscleChip}
                  compact
                >
                  {muscle}
                </Chip>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Equipment */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Equipment
            </Text>
            <Text variant="bodyLarge">
              {exercise.equipment.length > 0 
                ? exercise.equipment.join(', ')
                : 'No equipment required'}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Instructions */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Instructions
            </Text>
            <Text variant="bodyLarge" style={styles.instructions}>
              {exercise.instructions}
            </Text>
          </View>

          {/* Video URL (placeholder for future enhancement) */}
          {exercise.videoUrl && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Video
                </Text>
                <Text variant="bodyMedium" style={styles.placeholderText}>
                  Video player coming soon
                </Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    marginBottom: SPACING.lg,
    elevation: 2,
  },
  title: {
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chip: {
    marginRight: SPACING.xs,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  section: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  muscleGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  muscleChip: {
    marginBottom: SPACING.xs,
    marginRight: SPACING.xs,
  },
  instructions: {
    lineHeight: 24,
  },
  placeholderText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

export default ExerciseDetailScreen;
