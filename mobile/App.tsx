import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from '@navigation/AppNavigator';
import paperTheme, { navigationTheme } from '@theme';

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
