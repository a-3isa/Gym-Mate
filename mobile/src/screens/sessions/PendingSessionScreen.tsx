import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Divider,
  useTheme,
  Chip,
  Switch,
  TextInput,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getSessionById, acceptSession } from '../../services/api/session.service';
import { Session } from '../../types/models';
import useAuth from '../../hooks/useAuth';
import { SPACING } from '../../utils/constants';
import { SessionsStackRouteProp, SessionsStackNavigationProp } from '../../navigation/types';

/**
 * PendingSessionScreen - Displays pending session details and accept/decline actions
 */
const PendingSessionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<SessionsStackNavigationProp>();
  const route = useRoute<SessionsStackRouteProp<'PendingSession'>>();
  const { sessionId } = route.params;
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [proposeChanges, setProposeChanges] = useState(false);
  const [editableExercises, setEditableExercises] = useState<
    { exerciseId: string; exerciseName: string; targetSets: number }[]
  >([]);

  /**
   * Fetches session data
   */
  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessionById(sessionId);
      setSession(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch session data');
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (session.status === 'active') {
      navigation.replace('ActiveSession', { sessionId });
      return;
    }

    if (session.status === 'cancelled' || session.status === 'completed') {
      Alert.alert('Session Unavailable', 'This session is no longer pending.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Sessions');
      }
      return;
    }

    const sourceExercises = session.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      targetSets: exercise.targetSets,
    }));

    setEditableExercises(sourceExercises);
    setProposeChanges(false);
  }, [session]);

  const partner = useMemo(
    () => session?.participants.find((participant) => participant.uid !== user?.uid),
    [session, user?.uid],
  );

  const myParticipant = useMemo(
    () => session?.participants.find((participant) => participant.uid === user?.uid),
    [session, user?.uid],
  );

  const isCreator = session?.createdBy === user?.uid;
  const awaitingCreatorConfirmation = Boolean(session?.awaitingCreatorConfirmation);

  /**
   * Handles accepting the session
   */
  const handleInviteeDecision = useCallback(
    async (accepted: boolean) => {
      if (!session) return;

      setProcessing(true);
      try {
        const exercisesPayload =
          accepted && proposeChanges
            ? editableExercises.map((exercise) => ({
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                targetSets: exercise.targetSets,
              }))
            : undefined;

        const updatedSession = await acceptSession(sessionId, accepted, exercisesPayload);
        setSession(updatedSession);

        if (!accepted) {
          Alert.alert('Declined', 'Session declined.');
          navigation.goBack();
          return;
        }

        if (updatedSession.status === 'active') {
          navigation.replace('ActiveSession', { sessionId });
          return;
        }

        if (exercisesPayload) {
          Alert.alert('Proposal Sent', 'Your proposed exercises were sent to the creator.');
        } else {
          Alert.alert('Accepted', 'Session accepted. Waiting for other participants.');
        }

        await fetchSession();
        setProposeChanges(false);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update session');
        console.error('Error updating session:', error);
      } finally {
        setProcessing(false);
      }
    },
    [session, proposeChanges, editableExercises, sessionId, navigation, fetchSession],
  );

  /**
   * Handles decline for direct button press
   */
  const handleDecline = useCallback(() => {
    void handleInviteeDecision(false);
  }, [handleInviteeDecision]);

  const handleCreatorDecision = useCallback(
    async (accepted: boolean) => {
      setProcessing(true);
      try {
        const updatedSession = await acceptSession(sessionId, accepted);
        setSession(updatedSession);

        if (accepted && updatedSession.status === 'active') {
          Alert.alert('Session Activated', 'Proposed exercises confirmed.');
          navigation.replace('ActiveSession', { sessionId });
          return;
        }

        if (accepted) {
          Alert.alert('Confirmed', 'Session confirmed. Waiting for other participants.');
        } else {
          Alert.alert('Proposals Declined', 'Proposed exercises were declined.');
        }

        await fetchSession();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update session');
        console.error('Error handling proposals:', error);
      } finally {
        setProcessing(false);
      }
    },
    [sessionId, navigation, fetchSession],
  );

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
        <Text>Session not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.sessionCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={{ marginBottom: SPACING.md }}>
            Workout Session with {partner?.displayName || 'Unknown'}
          </Text>

          <View style={styles.statusContainer}>
            <Chip compact mode="flat">
              {session.status}
            </Chip>
          </View>

          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.md }}
          >
            {session.exercises.length} exercises planned
          </Text>

          {awaitingCreatorConfirmation && (
            <View style={styles.infoBanner}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}
              >
                {isCreator
                  ? 'The invited participant proposed updates. Review and confirm below.'
                  : 'Awaiting creator confirmation on the proposed exercises.'}
              </Text>
            </View>
          )}

          <Divider style={{ marginBottom: SPACING.md }} />

          <Text variant="titleMedium" style={{ marginBottom: SPACING.md }}>
            Exercises
          </Text>

          {session.exercises.map((exercise) => (
            <View key={exercise.exerciseId} style={styles.exerciseItem}>
              <View>
                <Text variant="bodyLarge">{exercise.exerciseName}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Planned: {exercise.targetSets} sets
                </Text>
              </View>
              {proposeChanges && !awaitingCreatorConfirmation && myParticipant?.status === 'invited' ? (
                <TextInput
                  mode="outlined"
                  dense
                  keyboardType="number-pad"
                  label="Target Sets"
                  value={String(
                    editableExercises.find((item) => item.exerciseId === exercise.exerciseId)
                      ?.targetSets ?? exercise.targetSets,
                  )}
                  onChangeText={(value) => {
                    const parsed = Number.parseInt(value, 10);
                    const sanitized = Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 1), 10);
                    setEditableExercises((prev) =>
                      prev.map((item) =>
                        item.exerciseId === exercise.exerciseId
                          ? { ...item, targetSets: sanitized }
                          : item,
                      ),
                    );
                  }}
                  style={styles.targetInput}
                  disabled={processing}
                />
              ) : (
                <Chip compact mode="outlined">
                  {exercise.targetSets} sets
                </Chip>
              )}
            </View>
          ))}

          {session.proposedExercises && session.proposedExercises.length > 0 && (
            <View style={styles.proposedContainer}>
              <Divider style={{ marginVertical: SPACING.md }} />
              <Text variant="titleMedium" style={{ marginBottom: SPACING.sm }}>
                Proposed Exercises
              </Text>
              {session.proposedExercises.map((exercise) => (
                <View key={exercise.exerciseId} style={styles.proposedItem}>
                  <Text variant="bodyLarge">{exercise.exerciseName}</Text>
                  <Chip compact mode="flat">
                    {exercise.targetSets} sets
                  </Chip>
                </View>
              ))}
            </View>
          )}

          <Divider style={{ marginVertical: SPACING.md }} />

          <Text variant="titleMedium" style={{ marginBottom: SPACING.md }}>
            Participants
          </Text>

          {session.participants.map((participant) => (
            <View key={participant.uid} style={styles.participantItem}>
              <Text variant="bodyLarge">{participant.displayName}</Text>
              <Chip compact mode="outlined" style={{ marginLeft: 'auto' }}>
                {participant.status}
              </Chip>
            </View>
          ))}
        </Card.Content>
      </Card>

      {!isCreator && myParticipant?.status === 'invited' && !awaitingCreatorConfirmation && (
        <View style={styles.actionsContainer}>
          <View style={styles.proposeRow}>
            <Text variant="bodyMedium">Propose exercise changes</Text>
            <Switch
              value={proposeChanges}
              onValueChange={setProposeChanges}
              disabled={processing}
            />
          </View>
          {proposeChanges && (
            <Button
              mode="text"
              onPress={() => {
                if (!session) return;
                setEditableExercises(
                  session.exercises.map((exercise) => ({
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    targetSets: exercise.targetSets,
                  })),
                );
              }}
              disabled={processing}
            >
              Reset to original plan
            </Button>
          )}
          <Button
            mode="contained"
            onPress={() => void handleInviteeDecision(true)}
            loading={processing}
            disabled={processing}
            style={styles.acceptButton}
          >
            {proposeChanges ? 'Accept & Send Proposal' : 'Accept Session'}
          </Button>
          <Button
            mode="outlined"
            onPress={handleDecline}
            loading={processing}
            disabled={processing}
            style={styles.declineButton}
          >
            Decline
          </Button>
        </View>
      )}

      {isCreator && awaitingCreatorConfirmation && session.proposedExercises?.length ? (
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={() => void handleCreatorDecision(true)}
            loading={processing}
            disabled={processing}
            style={styles.acceptButton}
          >
            Confirm Proposed Plan
          </Button>
          <Button
            mode="outlined"
            onPress={() => void handleCreatorDecision(false)}
            loading={processing}
            disabled={processing}
            style={styles.declineButton}
          >
            Reject Proposal
          </Button>
        </View>
      ) : null}

      {!isCreator && awaitingCreatorConfirmation && (
        <View style={styles.waitingContainer}>
          <Text
            variant="bodyMedium"
            style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}
          >
            Waiting for the creator to confirm the proposed plan...
          </Text>
        </View>
      )}

      {myParticipant?.status === 'accepted' && !awaitingCreatorConfirmation && !isCreator && (
        <View style={styles.waitingContainer}>
          <Text
            variant="bodyMedium"
            style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}
          >
            Waiting for other participants to respond...
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCard: {
    marginBottom: SPACING.lg,
  },
  statusContainer: {
    marginBottom: SPACING.md,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  actionsContainer: {
    marginTop: SPACING.lg,
  },
  acceptButton: {
    marginBottom: SPACING.md,
  },
  declineButton: {
    marginBottom: SPACING.md,
  },
  waitingContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  proposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoBanner: {
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: SPACING.md,
  },
  proposedContainer: {
    marginTop: SPACING.sm,
  },
  proposedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  targetInput: {
    width: 110,
  },
});

export default PendingSessionScreen;
