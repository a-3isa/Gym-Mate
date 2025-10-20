import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, FAB, useTheme, Card, Chip, ActivityIndicator, Divider, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING } from '../utils/constants';
import { getUserSessions } from '../services/api/session.service';
import { Session, SessionStatus, MuscleGroups } from '../types/models';
import useAuth from '../hooks/useAuth';
import { SessionsStackNavigationProp } from '../navigation/types';
import useAvatar from '../hooks/useAvatar';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import { getPublicUser } from '../services/api/profile.service';

const defaultMuscleGroups: MuscleGroups = {
  chest: 1,
  back: 1,
  legs: 1,
  shoulders: 1,
  arms: 1,
  core: 1,
};

/**
 * Parses a Firestore timestamp into a Date object
 * @param timestamp - Firestore timestamp (seconds/nanoseconds or ISO string)
 * @returns Date object
 */
const parseTimestamp = (timestamp: any): Date => {
  if (timestamp && typeof timestamp === 'object') {
    if (timestamp.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    if (timestamp._seconds !== undefined) {
      return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
    }
  }
  // Fallback to Date constructor for ISO strings or other formats
  return new Date(timestamp);
};

/**
 * SessionsScreen - Displays list of workout sessions with status filtering
 * 
 * TODO: Implement dedicated workout history section/screen with AvatarDisplay
 * for each completed session entry using user's avatarMuscleGroups to show
 * avatar state at time of workout completion.
 */
const SessionsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<SessionsStackNavigationProp>();
  const { user } = useAuth();
  const { avatarState } = useAvatar();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus | null>(null);
  const [partnerAvatars, setPartnerAvatars] = useState<Record<string, MuscleGroups>>({});

  /**
   * Fetches sessions from the backend
   */
  const fetchSessions = useCallback(async () => {
    try {
      const data = await getUserSessions(selectedStatus || undefined);
      setSessions(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch sessions');
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus]);

  // Fetch sessions on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions])
  );

  /**
   * Handles pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions();
  }, [fetchSessions]);

  /**
   * Handles status filter chip press
   */
  const handleStatusPress = useCallback((status: SessionStatus | null) => {
    setSelectedStatus(status);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadPartnerAvatars = async () => {
      const partnerIds = sessions
        .map((session) => session.participants.find((p) => p.uid !== user?.uid)?.uid)
        .filter((uid): uid is string => Boolean(uid))
        .filter((uid, index, arr) => arr.indexOf(uid) === index && !partnerAvatars[uid]);

      if (partnerIds.length === 0) {
        return;
      }

      try {
        const results = await Promise.all(
          partnerIds.map(async (uid) => {
            try {
              const publicUser = await getPublicUser(uid);
              return { uid, muscleGroups: publicUser.avatarMuscleGroups } as const;
            } catch (error) {
              console.error('Failed to load partner avatar', error);
              return { uid, muscleGroups: null as MuscleGroups | null } as const;
            }
          }),
        );

        if (!isCancelled) {
          setPartnerAvatars((current) => {
            const updated = { ...current };
            for (const result of results) {
              if (result.muscleGroups) {
                updated[result.uid] = result.muscleGroups;
              }
            }
            return updated;
          });
        }
      } catch (error) {
        console.error('Failed to load partner avatars', error);
      }
    };

    void loadPartnerAvatars();

    return () => {
      isCancelled = true;
    };
  }, [sessions, user?.uid, partnerAvatars]);

  /**
   * Navigates to session detail or active session
   */
  const handleSessionPress = useCallback((session: Session) => {
    if (session.status === 'active') {
      navigation.navigate('ActiveSession', { sessionId: session.id });
    } else if (session.status === 'pending') {
      navigation.navigate('PendingSession', { sessionId: session.id });
    } else {
      // For completed or cancelled sessions, show alert
      Alert.alert('Session Details', `Status: ${session.status}\nExercises: ${session.exercises.length}`);
    }
  }, [navigation]);

  /**
   * Renders a single session card
   */
  const renderSession = useCallback(({ item }: { item: Session }) => {
    const partner = item.participants.find(p => p.uid !== user?.uid);
    const statusColor = 
      item.status === 'active' ? 'success' :
      item.status === 'pending' ? 'warning' :
      item.status === 'completed' ? 'info' : 'error';
    const partnerMuscleGroups = partner?.uid ? partnerAvatars[partner.uid] : undefined;

    return (
      <TouchableOpacity onPress={() => handleSessionPress(item)}>
        <Card style={styles.sessionCard}>
          <Card.Content>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfoRow}>
                <AvatarDisplay
                  muscleGroups={avatarState?.muscleGroups || defaultMuscleGroups}
                  size={36}
                  style={styles.sessionAvatar}
                />
                <AvatarDisplay
                  muscleGroups={partnerMuscleGroups || defaultMuscleGroups}
                  size={36}
                  style={styles.sessionAvatar}
                />
                <Text variant="titleMedium">
                  {partner?.displayName || 'Unknown'}
                </Text>
              </View>
              <Chip compact mode="flat" textStyle={{ fontSize: 12 }}>
                {item.status}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {item.exercises.length} exercises
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              Created: {parseTimestamp(item.createdAt).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }, [user, colors, handleSessionPress]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headlineSmall" style={[styles.header, { color: colors.onSurface }]}>
        Workout Sessions
      </Text>
      
      {/* Status Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chipContainer}
      >
        <Chip
          mode={selectedStatus === null ? 'flat' : 'outlined'}
          onPress={() => handleStatusPress(null)}
          style={styles.chip}
        >
          All
        </Chip>
        <Chip
          mode={selectedStatus === 'pending' ? 'flat' : 'outlined'}
          onPress={() => handleStatusPress('pending')}
          style={styles.chip}
          icon="clock-outline"
        >
          Pending
        </Chip>
        <Chip
          mode={selectedStatus === 'active' ? 'flat' : 'outlined'}
          onPress={() => handleStatusPress('active')}
          style={styles.chip}
          icon="play"
        >
          Active
        </Chip>
        <Chip
          mode={selectedStatus === 'completed' ? 'flat' : 'outlined'}
          onPress={() => handleStatusPress('completed')}
          style={styles.chip}
          icon="check"
        >
          Completed
        </Chip>
        <Chip
          mode={selectedStatus === 'cancelled' ? 'flat' : 'outlined'}
          onPress={() => handleStatusPress('cancelled')}
          style={styles.chip}
          icon="close"
        >
          Cancelled
        </Chip>
      </ScrollView>

      {/* Sessions List */}
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.placeholder, { color: colors.onSurfaceVariant }]}>
              No sessions found. Create one to get started!
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('CreateSession')}
              style={styles.createButton}
            >
              Create Session
            </Button>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSession')}
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
    padding: SPACING.lg
  },
  header: {
    marginBottom: SPACING.md
  },
  placeholder: {
    marginBottom: SPACING.lg
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chipContainer: {
    marginBottom: SPACING.md
  },
  chip: {
    marginRight: SPACING.sm
  },
  sessionCard: {
    marginVertical: SPACING.xs
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  sessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sessionAvatar: {
    marginRight: SPACING.xs / 2,
  },
  listContent: {
    paddingBottom: 80
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    alignItems: 'center'
  },
  createButton: {
    marginTop: SPACING.md
  }
});

export default SessionsScreen;
