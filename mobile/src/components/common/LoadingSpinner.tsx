import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

type LoadingSpinnerProps = {
  size?: number;
  color?: string;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 48,
  color,
  fullScreen = true,
  style
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.inlineContainer;

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} animating color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default LoadingSpinner;
