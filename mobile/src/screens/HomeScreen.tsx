import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import useAuth from '@hooks/useAuth';
import useAvatar from '@hooks/useAvatar';
import Avatar3DDisplay from '@components/avatar/Avatar3DDisplay';
import AvatarProgressCard from '@components/avatar/AvatarProgressCard';
import { SPACING } from '@utils/constants';
// Define tab navigation type locally since it may not be exported
type RootTabParamList = {
  Home: undefined;
  Sessions: undefined;
  Exercises: undefined;
  Profile: undefined;
};

type HomeNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

const HomeScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<HomeNavigationProp>();
  const { user } = useAuth();
  const { avatarState, loading: avatarLoading } = useAvatar();

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Welcome message with user name and level */}
      <Text variant="headlineMedium" style={[styles.title, { color: colors.onSurface }]}>
        Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
        {avatarState && ` (Level ${avatarState.level})`}
      </Text>
      
      {/* Avatar Display with customization and progression - now supports 3D rendering with automatic fallback */}
      {avatarLoading ? (
        <ActivityIndicator size="large" style={styles.avatar} />
      ) : avatarState ? (
        <Avatar3DDisplay 
          muscleGroups={avatarState.muscleGroups}
          avatarConfig={user?.avatarConfig}
          size={120}
        />
      ) : null}
      
      <Text style={[styles.subtitle, { color: colors.onSurface }]}>
        Track your workouts, join sessions with friends, and stay motivated on your fitness journey.
      </Text>
      
      {/* Avatar Progress Card with full stats */}
      {avatarState && (
        <AvatarProgressCard avatarState={avatarState} compact={false} />
      )}
      
      {/* Start Workout Button */}
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('Sessions')}
        style={styles.button}
      >
        Start a Workout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg
  },
  title: {
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  subtitle: {
    marginBottom: SPACING.lg,
    textAlign: 'center'
  },
  avatar: {
    marginVertical: SPACING.lg
  },
  button: {
    marginTop: SPACING.lg
  }
});

export default HomeScreen;
