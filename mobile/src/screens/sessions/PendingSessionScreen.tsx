import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, ActivityIndicator, Divider, useTheme, Chip } from 'react-native-paper';
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

  /**
   * Fetches session data
   */
  const fetchSession = useCallback(async () => {
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

  /**
   * Handles accepting the session
   */
  const handleAccept = useCallback(async () => {
    if (!session) return;

    setProcessing(true);
    try {
      const updatedSession = await acceptSession(sessionId, true);
      setSession(updatedSession);

      if (updatedSession.status === 'active') {
        // Session is now active, navigate to ActiveSession
        navigation.replace('ActiveSession', { sessionId });
      } else {
        // Session is still pending, stay here or go back
        Alert.alert('Accepted', 'Session accepted. Waiting for other participants.');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept session');
      console.error('Error accepting session:', error);
    } finally {
      setProcessing(false);
    }
  }, [session, sessionId, navigation]);

  /**
   * Handles declining the session
   */
  const handleDecline = useCallback(async () => {
    setProcessing(true);
    try {
      const updatedSession = await acceptSession(sessionId, false);
      setSession(updatedSession);
      Alert.alert('Declined', 'Session declined.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline session');
      console.error('Error declining session:', error);
    } finally {
      setProcessing(false);
    }
  }, [sessionId, navigation]);

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

  const partner = session.participants.find(p => p.uid !== user?.uid);
  const myParticipant = session.participants.find(p => p.uid === user?.uid);

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

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.lg }}>
            {session.exercises.length} exercises planned
          </Text>

          <Divider style={{ marginBottom: SPACING.md }} />

          <Text variant="titleMedium" style={{ marginBottom: SPACING.md }}>
            Exercises
          </Text>

          {session.exercises.map((exercise, index) => (
            <View key={exercise.exerciseId} style={styles.exerciseItem}>
              <Text variant="bodyLarge">{exercise.exerciseName}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {exercise.targetSets} sets
              </Text>
            </View>
          ))}

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

      {myParticipant?.status === 'invited' && (
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleAccept}
            loading={processing}
            disabled={processing}
            style={styles.acceptButton}
          >
            Accept Session
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

      {myParticipant?.status === 'accepted' && (
        <View style={styles.waitingContainer}>
          <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
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
});

export default PendingSessionScreen;
