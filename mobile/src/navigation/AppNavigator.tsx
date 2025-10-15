import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
