import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal as RNModal } from 'react-native';
import { Card, Text, Button, TextInput, ProgressBar, Chip, ActivityIndicator, Divider, useTheme, Portal, Dialog } from 'react-native-paper';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getSessionById, recordSet, switchTurn, completeSession } from '../../services/api/session.service';
import { Session, SessionExercise, SetRecord } from '../../types/models';
import useAuth from '../../hooks/useAuth';
import useAvatar from '../../hooks/useAvatar';
import AvatarDisplay from '../../components/avatar/AvatarDisplay';
import AvatarEvolutionModal from '../../components/avatar/AvatarEvolutionModal';
import { SPACING, SOCKET_EVENTS, TIMERS } from '../../utils/constants';
import useSessionSocket from '../../hooks/useSessionSocket';
import useTimer from '../../hooks/useTimer';
import TimerDisplay from '../../components/session/TimerDisplay';
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
  const { avatarState, refreshAvatar } = useAvatar();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionData, setEvolutionData] = useState<{
    previousLevel: number;
    newLevel: number;
    muscleGroupsGained: string[];
  } | null>(null);
  const { connect: socketConnect, disconnect: socketDisconnect, on, off, emit } = useSessionSocket();
  const isFetchingRef = useRef(false);
  const completedRef = useRef(false);
  const [restTimerStartedBy, setRestTimerStartedBy] = useState<string | null>(null);
  const [workoutTimerStartedBy, setWorkoutTimerStartedBy] = useState<string | null>(null);
  const lastStartIntentRef = useRef<{ timerType: string; timestamp: number } | null>(null);
  const lastStopIntentRef = useRef<{ timerType: string; timestamp: number } | null>(null);
  const preLevelRef = useRef<number | null>(null);

  const restTimer = useTimer(TIMERS.DEFAULT_REST_DURATION, () => {
    // Optional auto progression: notify stop and optionally switch turn via REST
    emit(SOCKET_EVENTS.TIMER_STOP, { sessionId, timerType: 'rest' });
    // Business rule: we avoid auto switch; prompt/UX can be added later
  });
  const workoutTimer = useTimer(TIMERS.DEFAULT_WORKOUT_DURATION, () => {
    emit(SOCKET_EVENTS.TIMER_STOP, { sessionId, timerType: 'workout' });
  });

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

  // Replace polling with WebSocket connection
  useEffect(() => {
    fetchSession();
    void socketConnect(sessionId);

    const onSessionUpdate = (payload: any) => {
      if (payload?.session) setSession(payload.session);
    };
    const onSetComplete = (_payload: any) => {
      // Feedback only; authoritative update arrives via session:update
    };
    const onWeightUpdate = (_payload: any) => {
      // Non-authoritative hint for external consumers
    };
    const onExerciseChange = (payload: any) => {
      // Optimistic update for immediate UI feedback
      if (payload?.sessionId === sessionId && typeof payload?.exerciseIndex === 'number') {
        setSession(prev => prev ? { ...prev, currentExerciseIndex: payload.exerciseIndex } : null);
      }
    };
    const onSessionEnd = async () => {
      if (completedRef.current) return; // Prevent double navigation
      completedRef.current = true;
      
      // Check for avatar level-up after session completion
      const previousLevel = avatarState?.level || 1;
      await refreshAvatar();
      // Will check new level after refresh in a separate effect
      
      Alert.alert('Session Completed', 'This workout has ended.');
      // Navigation will happen after evolution modal if needed
      if (!showEvolutionModal) {
        navigation.navigate('Sessions');
      }
    };
    const onSessionStart = () => {
      // Optional feedback; UI derives from session:update
    };
    const onTimerStart = (payload: any) => {
      if (payload?.timerType === 'rest') {
        // Guard: if this is our own timer and it's already active, ignore
        if (payload.startedBy === user?.uid && restTimer.isActive) {
          return;
        }
        setRestTimerStartedBy(payload.startedBy ?? null);
        restTimer.reset();
        restTimer.sync(payload.duration);
        restTimer.start();
      } else if (payload?.timerType === 'workout') {
        // Guard: if this is our own timer and it's already active, ignore
        if (payload.startedBy === user?.uid && workoutTimer.isActive) {
          return;
        }
        setWorkoutTimerStartedBy(payload.startedBy ?? null);
        workoutTimer.reset();
        workoutTimer.sync(payload.duration);
        workoutTimer.start();
      }
    };
    const onTimerSync = (payload: any) => {
      if (payload?.timerType === 'rest') {
        restTimer.sync(payload.remainingSeconds);
      } else if (payload?.timerType === 'workout') {
        workoutTimer.sync(payload.remainingSeconds);
      }
    };
    const onTimerStop = (payload: any) => {
      if (payload?.timerType === 'rest') {
        restTimer.stop();
        setRestTimerStartedBy(null);
      } else if (payload?.timerType === 'workout') {
        workoutTimer.stop();
        setWorkoutTimerStartedBy(null);
      }
      lastStopIntentRef.current = null;
    };
    const onAvatarEvolution = (payload: any) => {
      // Handle avatar evolution event for current user
      if (payload?.userId === user?.uid && payload?.previousLevel && payload?.newLevel) {
        setEvolutionData({
          previousLevel: payload.previousLevel,
          newLevel: payload.newLevel,
          muscleGroupsGained: payload.muscleGroupsGained || [],
        });
        setShowEvolutionModal(true);
      }
    };
    const onError = (err: any) => {
      // Handle TIMER_ALREADY_ACTIVE error
      if (err?.code === 'TIMER_ALREADY_ACTIVE' && lastStartIntentRef.current) {
        const { timerType } = lastStartIntentRef.current;
        const now = Date.now();

        // Check if this error is recent (within 2 seconds of start intent)
        if (now - lastStartIntentRef.current.timestamp < 2000) {
          if (timerType === 'rest' && restTimer.isActive) {
            restTimer.stop();
            Alert.alert('Timer Conflict', 'A rest timer is already running. Your timer has been stopped.');
          } else if (timerType === 'workout' && workoutTimer.isActive) {
            workoutTimer.stop();
            Alert.alert('Timer Conflict', 'A workout timer is already running. Your timer has been stopped.');
          }
        }
        lastStartIntentRef.current = null;
        return;
      }

      if (err?.code === 'TIMER_STOP_ERROR' && lastStopIntentRef.current) {
        const { timerType } = lastStopIntentRef.current;
        const now = Date.now();

        if (now - lastStopIntentRef.current.timestamp < 2000) {
          if (timerType === 'rest' && !restTimer.isActive) {
            restTimer.start();
          } else if (timerType === 'workout' && !workoutTimer.isActive) {
            workoutTimer.start();
          }
        }
        lastStopIntentRef.current = null;
      }
    };

    on(SOCKET_EVENTS.SESSION_UPDATE, onSessionUpdate);
    on(SOCKET_EVENTS.SET_COMPLETE, onSetComplete);
    on(SOCKET_EVENTS.WEIGHT_UPDATE, onWeightUpdate);
    on(SOCKET_EVENTS.EXERCISE_CHANGE, onExerciseChange);
    on(SOCKET_EVENTS.SESSION_END, onSessionEnd);
    on(SOCKET_EVENTS.SESSION_START, onSessionStart);
    on(SOCKET_EVENTS.TIMER_START, onTimerStart);
    on(SOCKET_EVENTS.TIMER_SYNC, onTimerSync);
    on(SOCKET_EVENTS.TIMER_STOP, onTimerStop);
    on(SOCKET_EVENTS.AVATAR_EVOLUTION, onAvatarEvolution);
    on(SOCKET_EVENTS.ERROR, onError);

    return () => {
      off(SOCKET_EVENTS.SESSION_UPDATE, onSessionUpdate);
      off(SOCKET_EVENTS.SET_COMPLETE, onSetComplete);
      off(SOCKET_EVENTS.WEIGHT_UPDATE, onWeightUpdate);
      off(SOCKET_EVENTS.EXERCISE_CHANGE, onExerciseChange);
      off(SOCKET_EVENTS.SESSION_END, onSessionEnd);
      off(SOCKET_EVENTS.SESSION_START, onSessionStart);
      off(SOCKET_EVENTS.TIMER_START, onTimerStart);
      off(SOCKET_EVENTS.TIMER_SYNC, onTimerSync);
      off(SOCKET_EVENTS.TIMER_STOP, onTimerStop);
      off(SOCKET_EVENTS.AVATAR_EVOLUTION, onAvatarEvolution);
      off(SOCKET_EVENTS.ERROR, onError);
      socketDisconnect();
    };
  }, [fetchSession, on, off, socketConnect, socketDisconnect, sessionId, navigation]);

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
      emit(SOCKET_EVENTS.SET_COMPLETE, {
        sessionId,
        exerciseId: currentExercise.exerciseId,
        setNumber: myCompletedSets.length + 1,
        weight,
        reps,
      });
      setShowSetModal(false);
      setCurrentWeight('');
      setCurrentReps('');
    } catch (error) {
      Alert.alert('Error', 'Failed to record set');
      console.error('Error recording set:', error);
    } finally {
      setRecording(false);
    }
  }, [currentWeight, currentReps, currentExercise, sessionId, myCompletedSets.length, emit]);

  // Timer starters
  const startRestTimer = useCallback(() => {
    // Track start intent for error handling
    lastStartIntentRef.current = { timerType: 'rest', timestamp: Date.now() };
    
    setRestTimerStartedBy(user?.uid || null);
    restTimer.reset();
    restTimer.start();
    emit(SOCKET_EVENTS.TIMER_START, {
      sessionId,
      timerType: 'rest',
      duration: TIMERS.DEFAULT_REST_DURATION,
    });
  }, [emit, sessionId, user?.uid]);

  const startWorkoutTimer = useCallback(() => {
    // Track start intent for error handling
    lastStartIntentRef.current = { timerType: 'workout', timestamp: Date.now() };

    setWorkoutTimerStartedBy(user?.uid || null);
    workoutTimer.reset();
    workoutTimer.start();
    emit(SOCKET_EVENTS.TIMER_START, {
      sessionId,
      timerType: 'workout',
      duration: TIMERS.DEFAULT_WORKOUT_DURATION,
    });
  }, [emit, sessionId, user?.uid]);

  // Periodic sync every 3s
  // Timer sync: single interval using refs to avoid effect churn
  const restStateRef = useRef({ active: false, remaining: 0, startedBy: null as string | null });
  const workoutStateRef = useRef({ active: false, remaining: 0, startedBy: null as string | null });
  useEffect(() => {
    restStateRef.current.active = restTimer.isActive;
    restStateRef.current.remaining = restTimer.remainingSeconds;
    restStateRef.current.startedBy = restTimerStartedBy;
  }, [restTimer.isActive, restTimer.remainingSeconds, restTimerStartedBy]);
  useEffect(() => {
    workoutStateRef.current.active = workoutTimer.isActive;
    workoutStateRef.current.remaining = workoutTimer.remainingSeconds;
    workoutStateRef.current.startedBy = workoutTimerStartedBy;
  }, [workoutTimer.isActive, workoutTimer.remainingSeconds, workoutTimerStartedBy]);
  useEffect(() => {
    const interval = setInterval(() => {
      // Only emit timer:sync from the timer starter to reduce redundant traffic
      if (restStateRef.current.active && restStateRef.current.startedBy === user?.uid) {
        emit(SOCKET_EVENTS.TIMER_SYNC, {
          sessionId,
          timerType: 'rest',
          remainingSeconds: restStateRef.current.remaining,
        });
      }
      if (workoutStateRef.current.active && workoutStateRef.current.startedBy === user?.uid) {
        emit(SOCKET_EVENTS.TIMER_SYNC, {
          sessionId,
          timerType: 'workout',
          remainingSeconds: workoutStateRef.current.remaining,
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [emit, sessionId, user?.uid]);

  const stopRestTimer = useCallback(() => {
    lastStopIntentRef.current = { timerType: 'rest', timestamp: Date.now() };
    restTimer.stop();
    emit(SOCKET_EVENTS.TIMER_STOP, { sessionId, timerType: 'rest' });
  }, [emit, sessionId]);

  const stopWorkoutTimer = useCallback(() => {
    if (workoutTimerStartedBy && workoutTimerStartedBy !== user?.uid) {
      Alert.alert('Timer', 'Only the participant who started the workout timer can stop it.');
      return;
    }

    lastStopIntentRef.current = { timerType: 'workout', timestamp: Date.now() };
    workoutTimer.stop();
    emit(SOCKET_EVENTS.TIMER_STOP, { sessionId, timerType: 'workout' });
  }, [emit, sessionId, user?.uid, workoutTimerStartedBy]);

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
              completedRef.current = true; // Set flag to prevent double navigation
              const previousLevel = avatarState?.level || 1;
              
              await completeSession(sessionId);
              await refreshAvatar();
              
              // Check if level increased
              // The actual level check will be done in a separate effect
              setTimeout(() => {
                if (!showEvolutionModal) {
                  navigation.navigate('Sessions');
                }
              }, 500);
            } catch (error) {
              completedRef.current = false; // Reset flag on error
              Alert.alert('Error', 'Failed to complete session');
              console.error('Error completing session:', error);
            }
          },
        },
      ]
    );
  }, [sessionId, navigation, avatarState, refreshAvatar, showEvolutionModal]);

  // Check for level-up after avatar refresh
  useEffect(() => {
    if (avatarState && completedRef.current && preLevelRef.current !== null) {
      const previousLevel = preLevelRef.current;
      
      if (avatarState.level > previousLevel) {
        setEvolutionData({
          previousLevel,
          newLevel: avatarState.level,
          muscleGroupsGained: [], // Could be enhanced to track specific muscle gains
        });
        setShowEvolutionModal(true);
      }
    }
  }, [avatarState]);

  // Store initial level when session starts
  useEffect(() => {
    if (avatarState && !completedRef.current && preLevelRef.current === null) {
      preLevelRef.current = avatarState.level;
    }
  }, [avatarState]);

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

  if (!session) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text>No session data available</Text>
      </View>
    );
  }

  if (session.status === 'completed') {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background, padding: SPACING.lg }]}>
        <Card style={[styles.card, { width: '90%' }]}> 
          <Card.Content>
            <Text variant="headlineSmall" style={{ marginBottom: SPACING.md }}>
              Session Completed
            </Text>
            <Text variant="bodyMedium" style={{ marginBottom: SPACING.lg, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Great work! You can review other sessions or start a new workout anytime.
            </Text>
            <Button mode="contained" onPress={() => navigation.navigate('Sessions')}>
              Back to Sessions
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!currentExercise) {
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
            {/* Show avatar next to partner name */}
            <View style={styles.participantRow}>
              {avatarState && (
                <AvatarDisplay 
                  muscleGroups={avatarState.muscleGroups} 
                  size={48} 
                  style={styles.smallAvatar}
                />
              )}
              <Text variant="titleLarge">Workout with {partner?.displayName}</Text>
            </View>
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Exercise {session.currentExerciseIndex + 1} of {session.exercises.length}
          </Text>
          <ProgressBar progress={calculateProgress()} style={styles.progressBar} />
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Timers */}
      <TimerDisplay
        timerType="rest"
        remainingSeconds={restTimer.remainingSeconds}
        isActive={restTimer.isActive}
        onStart={startRestTimer}
        onStop={stopRestTimer}
        onReset={restTimer.reset}
      />
      <TimerDisplay
        timerType="workout"
        remainingSeconds={workoutTimer.remainingSeconds}
        isActive={workoutTimer.isActive}
        onStart={startWorkoutTimer}
        onStop={stopWorkoutTimer}
        onReset={workoutTimer.reset}
      />

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

      {/* Avatar Evolution Modal */}
      {evolutionData && (
        <AvatarEvolutionModal
          visible={showEvolutionModal}
          onDismiss={() => {
            setShowEvolutionModal(false);
            navigation.navigate('Sessions');
          }}
          previousLevel={evolutionData.previousLevel}
          newLevel={evolutionData.newLevel}
          muscleGroups={avatarState?.muscleGroups || {
            chest: 1,
            back: 1,
            legs: 1,
            shoulders: 1,
            arms: 1,
            core: 1,
          }}
          muscleGroupsGained={evolutionData.muscleGroupsGained}
        />
      )}
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
    marginBottom: SPACING.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  smallAvatar: {
    marginRight: SPACING.xs,
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
