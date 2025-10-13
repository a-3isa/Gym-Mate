import { NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Sessions: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined; // placeholder for upcoming auth flow
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

export type RootStackRouteProp<RouteName extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  RouteName
>;

export type MainTabRouteProp<RouteName extends keyof MainTabParamList> = RouteProp<
  MainTabParamList,
  RouteName
>;
