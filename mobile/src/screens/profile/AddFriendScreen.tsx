import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Keyboard } from 'react-native';
import {
  Searchbar,
  List,
  Avatar,
  Text,
  Button,
  ActivityIndicator,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { searchUserByEmail, addFriend, PublicUser } from '../../services/api/profile.service';
import { validateEmail } from '../../utils/validation';
import { SPACING } from '../../utils/constants';

/**
 * AddFriendScreen component for searching and adding friends by email
 * Implements debounced search to prevent excessive API calls
 */
const AddFriendScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PublicUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);


  const handleSearch = useCallback(async (email: string) => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Clear previous results
    setSearchResult(null);
    setError('');

    // Don't search for empty or invalid emails
    if (!email.trim()) {
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Debounce search by 300ms
    debounceTimer.current = setTimeout(async () => {
      if (!mounted.current) return;
      setSearching(true);
      try {
        const user = await searchUserByEmail(email);
        if (!mounted.current) return;
        if (user) {
          setSearchResult(user);
        } else {
          setError('User not found or not using Gym-Mate');
        }
      } catch (error: any) {
        if (!mounted.current) return;
        // Network failures get a specific error message
        setError(error.message || 'Temporary error, please try again');
      } finally {
        if (mounted.current) {
          setSearching(false);
        }
      }
    }, 300);
  }, []);

  const handleAddFriend = async () => {
    if (!searchResult) return;

    setAdding(true);
    Keyboard.dismiss();

    try {
      await addFriend(searchResult.email);
      Alert.alert(
        'Success',
        `${searchResult.displayName || searchResult.email} added as friend`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setAdding(false);
    }
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Searchbar
        placeholder="Search by email"
        value={searchQuery}
        onChangeText={onChangeSearch}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchBar}
      />

      {searching && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {!searching && searchResult && (
        <View style={styles.resultContainer}>
          <List.Item
            title={searchResult.displayName || searchResult.email}
            description={searchResult.email}
            left={() =>
              searchResult.photoURL ? (
                <Avatar.Image size={56} source={{ uri: searchResult.photoURL }} />
              ) : (
                <Avatar.Icon
                  size={56}
                  icon="account"
                  style={{ backgroundColor: colors.primaryContainer }}
                />
              )
            }
          />
          <Divider />
          <Button
            mode="contained"
            onPress={handleAddFriend}
            loading={adding}
            disabled={adding}
            style={styles.addButton}
          >
            Add Friend
          </Button>
        </View>
      )}

      {!searching && !searchResult && error && (
        <View style={styles.centerContent}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      {!searching && !searchResult && !error && searchQuery.length === 0 && (
        <View style={styles.centerContent}>
          <Text variant="bodyLarge" style={styles.instructionText}>
            Enter an email address to find friends
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  searchBar: {
    marginBottom: SPACING.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  resultContainer: {
    marginTop: SPACING.md,
  },
  addButton: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  instructionText: {
    textAlign: 'center',
    opacity: 0.5,
  },
});

export default AddFriendScreen;
