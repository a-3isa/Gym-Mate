import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@contexts';
import AppNavigator from '@navigation/AppNavigator';
import paperTheme, { navigationTheme } from '@theme';

const App = () => {
  return (
    // AuthProvider must wrap NavigationContainer so navigation can access auth state
    <AuthProvider>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default App;
