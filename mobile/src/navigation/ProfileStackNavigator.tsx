import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import CustomizeAvatarScreen from '../screens/profile/CustomizeAvatarScreen';
import Avatar3DSettingsScreen from '../screens/profile/Avatar3DSettingsScreen';
import FriendListScreen from '../screens/profile/FriendListScreen';
import AddFriendScreen from '../screens/profile/AddFriendScreen';
import { useTheme } from 'react-native-paper';

/**
 * ProfileStackNavigator handles all profile-related screens
 * including editing and friend management
 */
const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
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
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          presentation: 'modal',
        }}
      />
      {/** Avatar customization screen with modal presentation for consistent UX */}
      <Stack.Screen
        name="CustomizeAvatar"
        component={CustomizeAvatarScreen}
        options={{
          title: 'Customize Avatar',
          presentation: 'modal',
        }}
      />
      {/** 3D Avatar Settings screen provides 3D rendering configuration and performance monitoring */}
      <Stack.Screen
        name="Avatar3DSettings"
        component={Avatar3DSettingsScreen}
        options={{
          title: '3D Avatar Settings',
        }}
      />
      <Stack.Screen
        name="FriendList"
        component={FriendListScreen}
        options={{
          title: 'Friends',
        }}
      />
      <Stack.Screen
        name="AddFriend"
        component={AddFriendScreen}
        options={{
          title: 'Add Friend',
        }}
      />
    </Stack.Navigator>
  );
}
