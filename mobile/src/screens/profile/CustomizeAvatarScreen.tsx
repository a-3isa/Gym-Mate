import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Chip,
  Card,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import useAvatar from '../../hooks/useAvatar';
import AvatarDisplay from '../../components/avatar/AvatarDisplay';
import { updateAvatarConfig } from '../../services/api/profile.service';
import { AvatarConfig } from '../../types/models';
import {
  AVATAR_BODY_TYPES,
  AVATAR_SKIN_TONES,
  AVATAR_HAIR_STYLES,
  AVATAR_HAIR_COLORS,
  AVATAR_CLOTHING_STYLES,
  AVATAR_CLOTHING_COLORS,
  SPACING,
} from '../../utils/constants';
import { MuscleGroups } from '../../types/models';

// Default muscle groups for preview when avatar is not loaded
const defaultMuscleGroups: MuscleGroups = {
  chest: 1,
  back: 1,
  legs: 1,
  shoulders: 1,
  arms: 1,
  core: 1,
};

/**
 * CustomizeAvatarScreen component for avatar customization with live preview.
 * Allows users to customize their avatar's visual appearance including body type,
 * skin tone, hair style/color, and clothing style/color.
 * Changes are previewed live and saved to the backend upon confirmation.
 */
const CustomizeAvatarScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, refreshProfile } = useAuth();
  const { avatarState } = useAvatar();

  // State for customization options
  const [selectedBodyType, setSelectedBodyType] = useState<string>('athletic');
  const [selectedSkinTone, setSelectedSkinTone] = useState<string>('#FFE0BD');
  const [selectedHairStyle, setSelectedHairStyle] = useState<string>('short');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('#4A3728');
  const [selectedClothingStyle, setSelectedClothingStyle] = useState<string>('tshirt');
  const [selectedClothingColor, setSelectedClothingColor] = useState<string>('#3B82F6');
  const [saving, setSaving] = useState(false);

  // Helper function to validate hex color strings
  const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  // Initialize form with current user avatar config or defaults
  useEffect(() => {
    if (user?.avatarConfig) {
      setSelectedBodyType(user.avatarConfig.bodyType || 'athletic');
      setSelectedSkinTone(user.avatarConfig.skinTone || '#FFE0BD');
      setSelectedHairStyle(user.avatarConfig.hairStyle || 'short');
      setSelectedHairColor(user.avatarConfig.hairColor || '#4A3728');
      setSelectedClothingStyle(user.avatarConfig.clothingStyle || 'tshirt');
      setSelectedClothingColor(user.avatarConfig.clothingColor || '#3B82F6');
    }
  }, [user]);

  // Handle save button press
  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate all required fields are present
      if (!selectedBodyType || !selectedSkinTone || !selectedHairStyle || 
          !selectedHairColor || !selectedClothingStyle || !selectedClothingColor) {
        Alert.alert('Error', 'Please select all customization options');
        return;
      }

      // Validate hex colors to prevent 400 errors from backend
      if (!isValidHexColor(selectedSkinTone) || !isValidHexColor(selectedHairColor) || 
          !isValidHexColor(selectedClothingColor)) {
        Alert.alert('Error', 'Invalid color format. Please select from available options.');
        return;
      }

      // Construct avatar config object
      const avatarConfig: AvatarConfig = {
        bodyType: selectedBodyType as AvatarConfig['bodyType'],
        skinTone: selectedSkinTone,
        hairStyle: selectedHairStyle as AvatarConfig['hairStyle'],
        hairColor: selectedHairColor,
        clothingStyle: selectedClothingStyle as AvatarConfig['clothingStyle'],
        clothingColor: selectedClothingColor,
      };

      // Call update service
      await updateAvatarConfig(avatarConfig);

      // Refresh auth context
      await refreshProfile();

      // Show success message
      Alert.alert('Success', 'Avatar customization saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to save avatar customization:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to save avatar customization. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setSelectedBodyType('athletic');
    setSelectedSkinTone('#FFE0BD');
    setSelectedHairStyle('short');
    setSelectedHairColor('#4A3728');
    setSelectedClothingStyle('tshirt');
    setSelectedClothingColor('#3B82F6');
  };

  // Construct current configuration for preview
  const currentConfig: AvatarConfig = {
    bodyType: selectedBodyType as AvatarConfig['bodyType'],
    skinTone: selectedSkinTone,
    hairStyle: selectedHairStyle as AvatarConfig['hairStyle'],
    hairColor: selectedHairColor,
    clothingStyle: selectedClothingStyle as AvatarConfig['clothingStyle'],
    clothingColor: selectedClothingColor,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Live Preview Section */}
      <Card style={styles.previewCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Preview
          </Text>
          <View style={styles.previewContainer}>
            <AvatarDisplay
              muscleGroups={avatarState?.muscleGroups ?? defaultMuscleGroups}
              avatarConfig={currentConfig}
              size={200}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Body Type Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Body Type
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          {AVATAR_BODY_TYPES.map((bodyType) => (
            <Chip
              key={bodyType.key}
              selected={selectedBodyType === bodyType.key}
              onPress={() => setSelectedBodyType(bodyType.key)}
              style={styles.chip}
              mode="outlined"
            >
              {bodyType.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Skin Tone Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Skin Tone
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          {AVATAR_SKIN_TONES.map((tone) => (
            <TouchableOpacity
              key={tone.key}
              onPress={() => setSelectedSkinTone(tone.color)}
              style={styles.colorSwatchContainer}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: tone.color },
                  selectedSkinTone === tone.color && styles.selectedSwatch,
                ]}
              />
              <Text variant="bodySmall" style={styles.swatchLabel}>
                {tone.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Hair Style Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Hair Style
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          {AVATAR_HAIR_STYLES.map((style) => (
            <Chip
              key={style.key}
              selected={selectedHairStyle === style.key}
              onPress={() => setSelectedHairStyle(style.key)}
              style={styles.chip}
              mode="outlined"
            >
              {style.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Hair Color Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Hair Color
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          {AVATAR_HAIR_COLORS.map((color) => (
            <TouchableOpacity
              key={color.key}
              onPress={() => setSelectedHairColor(color.color)}
              style={styles.colorSwatchContainer}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.color },
                  selectedHairColor === color.color && styles.selectedSwatch,
                ]}
              />
              <Text variant="bodySmall" style={styles.swatchLabel}>
                {color.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Clothing Style Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Clothing Style
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          {AVATAR_CLOTHING_STYLES.map((style) => (
            <Chip
              key={style.key}
              selected={selectedClothingStyle === style.key}
              onPress={() => setSelectedClothingStyle(style.key)}
              style={styles.chip}
              mode="outlined"
            >
              {style.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Clothing Color Section */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Clothing Color
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          {AVATAR_CLOTHING_COLORS.map((color) => (
            <TouchableOpacity
              key={color.key}
              onPress={() => setSelectedClothingColor(color.color)}
              style={styles.colorSwatchContainer}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.color },
                  selectedClothingColor === color.color && styles.selectedSwatch,
                ]}
              />
              <Text variant="bodySmall" style={styles.swatchLabel}>
                {color.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={saving}
          style={styles.button}
        >
          {saving ? <ActivityIndicator size="small" /> : 'Save'}
        </Button>
        <Button
          mode="outlined"
          onPress={handleReset}
          disabled={saving}
          style={styles.button}
        >
          Reset to Defaults
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  previewCard: {
    marginBottom: SPACING.lg,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    fontWeight: 'bold',
  },
  optionsScroll: {
    flexGrow: 0,
  },
  chip: {
    marginRight: SPACING.xs,
  },
  colorSwatchContainer: {
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: SPACING.xs,
  },
  selectedSwatch: {
    borderColor: '#000',
    borderWidth: 3,
  },
  swatchLabel: {
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});

export default CustomizeAvatarScreen;
