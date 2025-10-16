import React, { useState,  useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import {
  List,
  Avatar,
  Text,
  FAB,
  ActivityIndicator,
  Divider,
  Button,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { getFriends, removeFriend } from '../../services/api/profile.service';
import { User } from '../../types/models';
import { SPACING } from '../../utils/constants';
import { ProfileStackNavigationProp } from '../../navigation/types';

/**
 * FriendListScreen component for displaying user's friends list
 * Allows viewing, removing friends, and navigating to add friends
 */
const FriendListScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<ProfileStackNavigationProp>();
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFriends = useCallback(async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch  {
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setFriends, setLoading, setRefreshing]);

  // Fetch friends on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [fetchFriends])
  );

  const handleRemoveFriend = (friend: User) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friend.uid);
              await fetchFriends();
              Alert.alert('Success', 'Friend removed successfully');
            } catch {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFriends();
  };

  const renderFriend = ({ item }: { item: User }) => (
    <List.Item
      title={item.displayName || item.email}
      description={item.email}
      left={() =>
        item.photoURL ? (
          <Avatar.Image size={48} source={{ uri: item.photoURL }} />
        ) : (
          <Avatar.Icon
            size={48}
            icon="account"
            style={{ backgroundColor: colors.primaryContainer }}
          />
        )
      }
      right={() => (
        <IconButton
          icon="close"
          iconColor={colors.error}
          onPress={() => handleRemoveFriend(item)}
        />
      )}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={renderFriend}
        ItemSeparatorComponent={() => <Divider />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={friends.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No friends yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Add friends to share workouts and compete together
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddFriend')}
              style={styles.addButton}
            >
              Add Friend
            </Button>
          </View>
        }
      />
      {friends.length > 0 && (
        <FAB
          icon="account-plus"
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddFriend')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
    opacity: 0.7,
  },
  addButton: {
    marginTop: SPACING.md,
  },
  fab: {
    position: 'absolute',
    margin: SPACING.lg,
    right: 0,
    bottom: 0,
  },
});

export default FriendListScreen;
