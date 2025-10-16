import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthStackNavigator from './AuthStackNavigator';
import MainTabNavigator from './MainTabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * AppNavigator implements conditional navigation based on authentication state.
 * Shows Auth stack for unauthenticated users and Main tabs for authenticated users.
 */
const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication state
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is authenticated - show main app
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        // User is not authenticated - show auth flow
        <Stack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
