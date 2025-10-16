import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal as RNModal } from 'react-native';
import { Card, Text, Button, TextInput, ProgressBar, Chip, ActivityIndicator, Divider, useTheme, Portal, Dialog } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getSessionById, recordSet, switchTurn, completeSession } from '../../services/api/session.service';
import { Session, SessionExercise, SetRecord } from '../../types/models';
import useAuth from '../../hooks/useAuth';
import { SPACING } from '../../utils/constants';
import { SessionsStackRouteProp, SessionsStackNavigationProp } from '../../navigation/types';

/**
 * ActiveSessionScreen - Turn-based workout session UI
 */
const ActiveSessionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<SessionsStackNavigationProp>();
  const route = useRoute<SessionsStackRouteProp<'ActiveSession'>>();
  const { sessionId } = route.params;
  const { user } = useAuth();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const isFetchingRef = useRef(false);

  /**
   * Fetches session data
   */
  const fetchSession = useCallback(async () => {
    if (isFetchingRef.current) return; // Prevent concurrent fetches
    
    isFetchingRef.current = true;
    try {
      const data = await getSessionById(sessionId);
      setSession(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch session data');
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [sessionId]);

  /**
   * Sets up polling for session updates (will be replaced by WebSocket in next phase)
   */
  useEffect(() => {
    fetchSession();
    
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchSession();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [fetchSession]);

  const isMyTurn = session?.currentTurn === user?.uid;
  const currentExerciseIndex = session ? session.currentExerciseIndex : undefined;
  const currentExercise = (session && currentExerciseIndex !== undefined && currentExerciseIndex >= 0 && currentExerciseIndex < session.exercises.length) ? session.exercises[currentExerciseIndex] : undefined;
  const myCompletedSets = session?.sets.filter(
    s => s.participantUid === user?.uid && s.exerciseId === currentExercise?.exerciseId
  ) || [];
  const partnerCompletedSets = session?.sets.filter(
    s => s.participantUid !== user?.uid && s.exerciseId === currentExercise?.exerciseId
  ) || [];
  const partner = session?.participants.find(p => p.uid !== user?.uid);

  /**
   * Records a completed set
   */
  const handleRecordSet = useCallback(async () => {
    if (!currentWeight || !currentReps || !currentExercise) return;
    
    const weight = parseFloat(currentWeight);
    const reps = parseInt(currentReps, 10);
    
    if (isNaN(weight) || isNaN(reps)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for weight and reps');
      return;
    }
    
    setRecording(true);
    try {
      const updatedSession = await recordSet(
        sessionId,
        currentExercise.exerciseId,
        myCompletedSets.length + 1,
        weight,
        reps
      );
      setSession(updatedSession);
      setShowSetModal(false);
      setCurrentWeight('');
      setCurrentReps('');
    } catch (error) {
      Alert.alert('Error', 'Failed to record set');
      console.error('Error recording set:', error);
    } finally {
      setRecording(false);
    }
  }, [currentWeight, currentReps, currentExercise, sessionId, myCompletedSets.length]);

  /**
   * Skips turn to partner
   */
  const handleSkipTurn = useCallback(async () => {
    Alert.alert(
      'Skip Turn',
      'Are you sure you want to skip your turn?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              const updatedSession = await switchTurn(sessionId);
              setSession(updatedSession);
            } catch (error) {
              Alert.alert('Error', 'Failed to switch turn');
              console.error('Error switching turn:', error);
            }
          },
        },
      ]
    );
  }, [sessionId]);

  /**
   * Completes the session
   */
  const handleCompleteSession = useCallback(async () => {
    Alert.alert(
      'Complete Session',
      'Are you sure you want to complete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeSession(sessionId);
              navigation.navigate('Sessions');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete session');
              console.error('Error completing session:', error);
            }
          },
        },
      ]
    );
  }, [sessionId, navigation]);

  /**
   * Calculates overall progress
   */
  const calculateProgress = () => {
    if (!session) return 0;
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.targetSets * 2, 0); // x2 for both participants
    const completedSets = session.sets.length;
    return completedSets / totalSets;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session || !currentExercise) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text>No session data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Session Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleLarge">Workout with {partner?.displayName}</Text>
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Exercise {session.currentExerciseIndex + 1} of {session.exercises.length}
          </Text>
          <ProgressBar progress={calculateProgress()} style={styles.progressBar} />
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Current Exercise */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Current Exercise</Text>
          <Text variant="headlineSmall" style={styles.exerciseName}>
            {currentExercise.exerciseName}
          </Text>
          <Text variant="bodyLarge">
            Target: {currentExercise.targetSets} sets
          </Text>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Your Sets */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Your Sets ({myCompletedSets.length}/{currentExercise.targetSets})</Text>
          {myCompletedSets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text>Set {set.setNumber}</Text>
              <Text>{set.weight}kg × {set.reps} reps</Text>
            </View>
          ))}
          {myCompletedSets.length === 0 && (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No sets completed yet</Text>
          )}
        </Card.Content>
      </Card>

      {/* Partner Sets */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">{partner?.displayName}'s Sets ({partnerCompletedSets.length}/{currentExercise.targetSets})</Text>
          {partnerCompletedSets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text>Set {set.setNumber}</Text>
              <Text>{set.weight}kg × {set.reps} reps</Text>
            </View>
          ))}
          {partnerCompletedSets.length === 0 && (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No sets completed yet</Text>
          )}
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Turn Controls */}
      <View style={styles.turnControls}>
        {isMyTurn ? (
          <>
            <Text variant="titleLarge" style={styles.turnText}>Your Turn!</Text>
            <Button
              mode="contained"
              onPress={() => setShowSetModal(true)}
              style={styles.actionButton}
              disabled={myCompletedSets.length >= currentExercise.targetSets}
            >
              Record Set
            </Button>
            <Button
              mode="outlined"
              onPress={handleSkipTurn}
              style={styles.actionButton}
            >
              Skip Turn
            </Button>
          </>
        ) : (
          <>
            <Text variant="titleLarge" style={styles.turnText}>
              Waiting for {partner?.displayName}...
            </Text>
            <ActivityIndicator style={styles.activityIndicator} />
          </>
        )}
      </View>

      {/* Complete Session Button */}
      <Button
        mode="text"
        onPress={handleCompleteSession}
        textColor={theme.colors.error}
        style={styles.completeButton}
      >
        Complete Session
      </Button>

      {/* Set Recording Modal */}
      <Portal>
        <Dialog visible={showSetModal} onDismiss={() => setShowSetModal(false)}>
          <Dialog.Title>Record Set</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Weight (kg)"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              keyboardType="numeric"
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Reps"
              value={currentReps}
              onChangeText={setCurrentReps}
              keyboardType="numeric"
              mode="outlined"
              style={styles.modalInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSetModal(false)}>Cancel</Button>
            <Button onPress={handleRecordSet} loading={recording} disabled={recording}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
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
  card: {
    margin: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    marginTop: SPACING.sm,
  },
  divider: {
    marginVertical: SPACING.xs,
  },
  exerciseName: {
    marginVertical: SPACING.sm,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  turnControls: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  turnText: {
    marginBottom: SPACING.md,
  },
  actionButton: {
    marginVertical: SPACING.xs,
    width: '100%',
  },
  activityIndicator: {
    marginTop: SPACING.md,
  },
  completeButton: {
    margin: SPACING.md,
  },
  modalInput: {
    marginBottom: SPACING.md,
  },
});

export default ActiveSessionScreen;
