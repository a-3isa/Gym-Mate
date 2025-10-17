import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { Text, Avatar, List, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useAuth from '@hooks/useAuth';
import useAvatar from '@hooks/useAvatar';
import AvatarDisplay from '@components/avatar/AvatarDisplay';
import AvatarProgressCard from '@components/avatar/AvatarProgressCard';
import { SPACING } from '@utils/constants';
import { ProfileStackNavigationProp } from '@navigation/types';

/**
 * ProfileScreen displays user information and account management options.
 * Includes logout functionality and user profile display.
 */
const ProfileScreen = () => {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { avatarState, loading: avatarLoading, refreshAvatar } = useAvatar();
  const navigation = useNavigation<ProfileStackNavigationProp>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAvatar();
    setRefreshing(false);
  }, [refreshAvatar]);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  if (isLoggingOut) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>Signing out...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Avatar Display with muscle groups or fallback */}
      {avatarLoading ? (
        <ActivityIndicator size="large" style={styles.avatar} />
      ) : avatarState ? (
        <AvatarDisplay 
          muscleGroups={avatarState.muscleGroups} 
          size={96} 
          style={styles.avatar}
        />
      ) : user?.photoURL ? (
        <Avatar.Image
          size={96}
          source={{ uri: user.photoURL }}
          style={styles.avatar}
        />
      ) : (
        <Avatar.Icon
          size={96}
          icon="account"
          style={styles.avatar}
          color={colors.onPrimary}
          theme={{ colors: { primary: colors.primary } }}
        />
      )}
      
      {/* Username with level */}
      <Text variant="headlineSmall" style={[styles.username, { color: colors.onSurface }]}>
        {user?.displayName || 'User'}
        {avatarState && ` • Lv. ${avatarState.level}`}
      </Text>
      <Text variant="bodyMedium" style={[styles.email, { color: colors.onSurfaceVariant }]}>
        {user?.email}
      </Text>
      
      {/* Avatar Progress Card */}
      <AvatarProgressCard avatarState={avatarState} compact={true} />
      
      <List.Section style={styles.listSection}>
        <List.Item 
          title="Edit Profile" 
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          onPress={() => navigation.navigate('EditProfile')}
          disabled={isLoggingOut}
        />
        <List.Item 
          title="Friends" 
          left={(props) => <List.Icon {...props} icon="account-multiple" />}
          onPress={() => navigation.navigate('FriendList')}
          disabled={isLoggingOut}
        />
        <List.Item 
          title="Settings" 
          left={(props) => <List.Icon {...props} icon="cog" />}
          disabled={isLoggingOut}
        />
        <List.Item 
          title="Sign Out" 
          left={(props) => <List.Icon {...props} icon="logout" color={colors.error} />}
          onPress={handleLogout}
          disabled={isLoggingOut}
          titleStyle={{ color: colors.error }}
        />
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xl * 1.5,
    paddingHorizontal: SPACING.lg
  },
  loadingContainer: {
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: SPACING.md
  },
  avatar: {
    marginBottom: SPACING.md
  },
  username: {
    marginBottom: SPACING.xs
  },
  email: {
    marginBottom: SPACING.lg
  },
  listSection: {
    alignSelf: 'stretch'
  }
});

export default ProfileScreen;
