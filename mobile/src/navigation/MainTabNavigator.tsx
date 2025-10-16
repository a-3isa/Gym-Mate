import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme as useNavTheme } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import ExercisesStackNavigator from './ExercisesStackNavigator';
import SessionsStackNavigator from './SessionsStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: 'home',
  Exercises: 'dumbbell',
  Sessions: 'account-group',
  Profile: 'account',
};

const MainTabNavigator = () => {
  const { colors } = useNavTheme();

  return (
    <Tab.Navigator
      screenOptions={({
        route
      }: {
        route: { name: keyof MainTabParamList };
      }) => ({
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.border,
        tabBarIcon: ({
          color,
          size
        }: {
          color: string;
          size: number;
        }) => {
          const iconName = TAB_ICONS[route.name] || 'circle';
          return <MaterialCommunityIcons name={iconName as any} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Exercises" 
        component={ExercisesStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Sessions" 
        component={SessionsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
