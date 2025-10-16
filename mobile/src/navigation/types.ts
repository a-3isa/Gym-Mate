import { NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

/**
 * Authentication stack screens
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/**
 * Profile stack screens for nested navigation within the Profile tab
 */
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  FriendList: undefined;
  AddFriend: undefined;
};

/**
 * Exercises stack screens for nested navigation within the Exercises tab
 */
export type ExercisesStackParamList = {
  Exercises: undefined;
  ExerciseDetail: { exerciseId: string };
};

/**
 * Sessions stack screens for nested navigation within the Sessions tab
 * Flow: Sessions list → CreateSession (friend selection) → SelectExercises (exercise selection) → ActiveSession (workout in progress)
 */
export type SessionsStackParamList = {
  Sessions: undefined; // List of sessions
  CreateSession: undefined; // Friend selection
  SelectExercises: { friendUid: string; friendName: string }; // Exercise selection with friend context
  PendingSession: { sessionId: string }; // Pending session details and accept/decline actions
  ActiveSession: { sessionId: string }; // Active workout session with turn-based UI
};

/**
 * Main tab navigator screens
 */
export type MainTabParamList = {
  Home: undefined;
  Exercises: NavigatorScreenParams<ExercisesStackParamList>;
  Sessions: NavigatorScreenParams<SessionsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

/**
 * Root stack navigator screens
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Navigation prop types
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type ProfileStackNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
export type ExercisesStackNavigationProp = NativeStackNavigationProp<ExercisesStackParamList>;
export type SessionsStackNavigationProp = NativeStackNavigationProp<SessionsStackParamList>;

// Route prop types
export type RootStackRouteProp<RouteName extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  RouteName
>;

export type AuthStackRouteProp<RouteName extends keyof AuthStackParamList> = RouteProp<
  AuthStackParamList,
  RouteName
>;

export type MainTabRouteProp<RouteName extends keyof MainTabParamList> = RouteProp<
  MainTabParamList,
  RouteName
>;

export type ProfileStackRouteProp<RouteName extends keyof ProfileStackParamList> = RouteProp<
  ProfileStackParamList,
  RouteName
>;

export type ExercisesStackRouteProp<RouteName extends keyof ExercisesStackParamList> = RouteProp<
  ExercisesStackParamList,
  RouteName
>;

export type SessionsStackRouteProp<RouteName extends keyof SessionsStackParamList> = RouteProp<
  SessionsStackParamList,
  RouteName
>;

// Screen props types for Profile stack
export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = NativeStackScreenProps<
  ProfileStackParamList,
  T
>;
