import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { SessionsStackParamList } from './types';
import SessionsScreen from '../screens/SessionsScreen';
import CreateSessionScreen from '../screens/sessions/CreateSessionScreen';
import SelectExercisesScreen from '../screens/sessions/SelectExercisesScreen';
import PendingSessionScreen from '../screens/sessions/PendingSessionScreen';
import ActiveSessionScreen from '../screens/sessions/ActiveSessionScreen';

const Stack = createNativeStackNavigator<SessionsStackParamList>();

/**
 * Sessions stack navigator handling all session-related screens.
 * Manages the creation flow (friend selection → exercise selection) and active workout session with turn-based UI.
 */
export default function SessionsStackNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{
          headerShown: false, // Tab navigator shows header
        }}
      />
      <Stack.Screen
        name="CreateSession"
        component={CreateSessionScreen}
        options={{
          title: 'Select Friend',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="SelectExercises"
        component={SelectExercisesScreen}
        options={{
          title: 'Select Exercises',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="PendingSession"
        component={PendingSessionScreen}
        options={{
          title: 'Pending Session',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ActiveSession"
        component={ActiveSessionScreen}
        options={{
          title: 'Workout Session',
          headerLeft: () => null, // Prevent back navigation during active session
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}
