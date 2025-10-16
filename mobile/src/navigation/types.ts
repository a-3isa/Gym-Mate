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
 * Main tab navigator screens
 */
export type MainTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Sessions: undefined;
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

// Screen props types for Profile stack
export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = NativeStackScreenProps<
  ProfileStackParamList,
  T
>;
