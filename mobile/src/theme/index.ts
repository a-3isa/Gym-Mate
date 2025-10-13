import { MD3LightTheme, MD3Theme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { COLORS } from '../utils/constants';

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    onSurface: COLORS.text,
    onBackground: COLORS.text,
    error: COLORS.error
  },
  roundness: 8
};

export const navigationTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: paperTheme.colors.primary,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    text: paperTheme.colors.onSurface,
    border: paperTheme.colors.secondary,
    notification: paperTheme.colors.primary
  }
};

export default paperTheme;
