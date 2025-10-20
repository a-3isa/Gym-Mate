import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Switch, 
  Card, 
  Button, 
  List, 
  Divider, 
  useTheme,
  RadioButton,
  ActivityIndicator
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { use3DAvatar } from '../../hooks/use3DAvatar';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { 
  checkDeviceCapability, 
  reset3DPreference 
} from '../../utils/deviceCapability';
import { SPACING } from '../../utils/constants';

/**
 * Settings screen for 3D avatar preferences.
 * Allows users to control 3D rendering preferences and view performance stats.
 * 
 * Features:
 * - Device capability status display
 * - Manual enable/disable 3D rendering
 * - Real-time performance metrics
 * - Quality settings (placeholder for future LOD)
 * - Reset to defaults option
 */
const Avatar3DSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { is3DCapable, is3DEnabled, toggle3D, loading: hookLoading } = use3DAvatar();
  
  const [currentFPS, setCurrentFPS] = useState<number>(0);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Monitor FPS when 3D is enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (is3DEnabled) {
      performanceMonitor.startMonitoring();
      
      // Update FPS display every second
      interval = setInterval(() => {
        setCurrentFPS(performanceMonitor.getFPS());
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (is3DEnabled) {
        performanceMonitor.stopMonitoring();
      }
    };
  }, [is3DEnabled]);

  const handleToggle3D = async (value: boolean) => {
    try {
      await toggle3D(value);
      
      if (value && !is3DCapable) {
        Alert.alert(
          'Device Not Capable',
          'Your device does not meet the minimum requirements for 3D rendering. The 2D avatar will be used instead.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update 3D preference. Please try again.');
    }
  };

  const handleResetToDefaults = async () => {
    Alert.alert(
      'Reset to Defaults',
      'This will clear your 3D preferences and re-detect device capabilities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setRefreshing(true);
              await reset3DPreference();
              
              // Re-check capability
              const capable = await checkDeviceCapability();
              await toggle3D(capable);
              
              Alert.alert('Success', 'Settings have been reset to defaults.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings. Please try again.');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]
    );
  };

  if (hookLoading || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Device Capability Status */}
      <Card style={styles.card}>
        <Card.Title title="Device Capability" />
        <Card.Content>
          <View style={styles.statusRow}>
            <Text>3D Rendering Support:</Text>
            <Text style={[
              styles.statusText,
              { color: is3DCapable ? theme.colors.primary : theme.colors.error }
            ]}>
              {is3DCapable ? 'Capable' : 'Not Capable'}
            </Text>
          </View>
          {!is3DCapable && (
            <Text style={styles.warningText}>
              Your device does not meet the minimum requirements for 3D rendering.
              The 2D avatar will be used for optimal performance.
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* 3D Rendering Toggle */}
      <Card style={styles.card}>
        <Card.Title title="3D Rendering" />
        <Card.Content>
          <View style={styles.switchRow}>
            <Text>Enable 3D Avatar</Text>
            <Switch
              value={is3DEnabled}
              onValueChange={handleToggle3D}
              disabled={!is3DCapable || refreshing}
            />
          </View>
          <Text style={styles.helperText}>
            3D avatars provide a more immersive experience but require more processing power.
          </Text>
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      {is3DEnabled && (
        <Card style={styles.card}>
          <Card.Title title="Performance Metrics" />
          <Card.Content>
            <View style={styles.metricRow}>
              <Text>Current FPS:</Text>
              <Text style={[
                styles.metricValue,
                { color: currentFPS >= 25 ? theme.colors.primary : theme.colors.error }
              ]}>
                {currentFPS}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text>Average FPS:</Text>
              <Text style={styles.metricValue}>
                {performanceMonitor.getAverageFPS()}
              </Text>
            </View>
            <Text style={styles.helperText}>
              For optimal experience, FPS should stay above 25.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Quality Settings (Placeholder for future LOD implementation) */}
      <Card style={styles.card}>
        <Card.Title title="Quality Settings" />
        <Card.Content>
          <RadioButton.Group
            onValueChange={(value) => setQuality(value as 'low' | 'medium' | 'high')}
            value={quality}
          >
            <RadioButton.Item 
              label="Low - Better performance" 
              value="low" 
              disabled={!is3DEnabled}
            />
            <RadioButton.Item 
              label="Medium - Balanced" 
              value="medium" 
              disabled={!is3DEnabled}
            />
            <RadioButton.Item 
              label="High - Best visuals" 
              value="high" 
              disabled={!is3DEnabled}
            />
          </RadioButton.Group>
          <Text style={styles.helperText}>
            Quality settings will be available in a future update.
          </Text>
        </Card.Content>
      </Card>

      {/* Reset Button */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleResetToDefaults}
            loading={refreshing}
            disabled={refreshing}
            style={styles.resetButton}
          >
            Reset to Defaults
          </Button>
        </Card.Content>
      </Card>

      {/* Information Section */}
      <Card style={styles.card}>
        <Card.Title title="About 3D Rendering" />
        <Card.Content>
          <Text style={styles.infoText}>
            3D avatar rendering enhances your fitness journey with immersive visuals 
            that better represent your progress. Your avatar will dynamically show 
            muscle development and customization in three dimensions.
          </Text>
          <Divider style={styles.divider} />
          <Text style={styles.infoText}>
            <Text style={{ fontWeight: 'bold' }}>Requirements:</Text>
            {'\n'}• iOS: iPhone 8 or newer
            {'\n'}• Android: 3GB+ RAM, 1080p+ screen
            {'\n'}• Custom development build (not Expo Go)
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 12,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: 12,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metricValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    marginTop: SPACING.sm,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default Avatar3DSettingsScreen;
