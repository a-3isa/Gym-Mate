import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { List, Avatar, ActivityIndicator, Divider, Button, Searchbar, useTheme, Text, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { getFriends } from '../../services/api/profile.service';
import { User } from '../../types/models';
import { SPACING } from '../../utils/constants';
import { SessionsStackNavigationProp } from '../../navigation/types';

/**
 * CreateSessionScreen - Friend selection for creating a workout session
 */
const CreateSessionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<SessionsStackNavigationProp>();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

  /**
   * Fetches friends list on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      const fetchFriends = async () => {
        try {
          const data = await getFriends();
          setFriends(data);
          setFilteredFriends(data);
        } catch (error) {
          Alert.alert('Error', 'Failed to fetch friends');
          console.error('Error fetching friends:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchFriends();
    }, [])
  );

  /**
   * Filters friends based on search query
   */
  React.useMemo(() => {
    if (!searchQuery) {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = friends.filter(
        friend => 
          friend.displayName.toLowerCase().includes(query) ||
          friend.email.toLowerCase().includes(query)
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  /**
   * Handles friend selection
   */
  const handleSelectFriend = useCallback((friend: User) => {
    setSelectedFriend(friend);
  }, []);

  /**
   * Continues to exercise selection
   */
  const handleContinue = useCallback(() => {
    if (!selectedFriend) {
      Alert.alert('Please select a friend', 'You must select a friend to create a session with');
      return;
    }
    
    navigation.navigate('SelectExercises', {
      friendUid: selectedFriend.uid,
      friendName: selectedFriend.displayName,
    });
  }, [selectedFriend, navigation]);

  /**
   * Renders a friend item
   */
  const renderFriend = useCallback(({ item }: { item: User }) => {
    const isSelected = selectedFriend?.uid === item.uid;
    
    return (
      <List.Item
        title={item.displayName}
        description={item.email}
        left={props => 
          item.photoURL ? (
            <Avatar.Image {...props} size={48} source={{ uri: item.photoURL }} />
          ) : (
            <Avatar.Icon {...props} size={48} icon="account" />
          )
        }
        right={props => (
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => handleSelectFriend(item)}
          />
        )}
        onPress={() => handleSelectFriend(item)}
        style={isSelected ? { backgroundColor: theme.colors.primaryContainer } : undefined}
      />
    );
  }, [selectedFriend, handleSelectFriend, theme.colors.primaryContainer]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search friends"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <FlatList
        data={filteredFriends}
        renderItem={renderFriend}
        keyExtractor={item => item.uid}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={friends.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {searchQuery ? 'No friends found matching your search' : 'No friends found. Add friends from your profile!'}
            </Text>
          </View>
        }
      />
      
      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!selectedFriend}
        style={styles.continueButton}
      >
        Continue
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
  searchbar: {
    margin: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  continueButton: {
    margin: SPACING.md,
  },
});

export default CreateSessionScreen;
