import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Avatar,
  Text,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import useAuth from '@hooks/useAuth';
import { updateProfile, uploadAvatar } from '../../services/api/profile.service';
import {
  validateDisplayName,
  validateHeight,
  validateWeight,
} from '../../utils/validation';
import { SPACING } from '../../utils/constants';

/**
 * EditProfileScreen component for editing user profile
 * Allows users to update displayName, height, weight, and avatar
 */
const EditProfileScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form with current user data
    if (user) {
      setDisplayName(user.displayName || '');
      setHeight(user.height ? user.height.toString() : '');
      setWeight(user.weight ? user.weight.toString() : '');
    }
  }, [user]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Convert image to JPEG format to ensure compatibility (handles HEIC conversion)
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [], // No manipulations, just format conversion
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        // Create a new asset object with JPEG format
        const convertedAsset: ImagePickerAsset = {
          ...asset,
          uri: manipulatedImage.uri,
          mimeType: 'image/jpeg',
          fileName: asset.fileName?.replace(/\.(heic|HEIC)$/i, '.jpg') || 'avatar.jpg',
        };

        setSelectedAsset(convertedAsset);
        setImageUri(convertedAsset.uri);
      }
    } catch (error) {
      console.error('Failed to pick or process image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (displayName && !validateDisplayName(displayName)) {
      newErrors.displayName = 'Name must be 2-50 characters (letters, spaces, hyphens, apostrophes only)';
    }

    const heightNum = parseFloat(height);
    if (height && (!heightNum || !validateHeight(heightNum))) {
      newErrors.height = 'Height must be between 50 and 300 cm';
    }

    const weightNum = parseFloat(weight);
    if (weight && (!weightNum || !validateWeight(weightNum))) {
      newErrors.weight = 'Weight must be between 20 and 500 kg';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Upload avatar if changed
      if (imageUri && selectedAsset) {
        await uploadAvatar(imageUri, {
          fileName: selectedAsset.fileName || 'avatar.jpg',
          mimeType: selectedAsset.mimeType || 'image/jpeg',
          type: selectedAsset.mimeType || 'image/jpeg',
        });
      }

      // Update profile fields
      const updates: any = {};
      if (displayName && displayName !== user?.displayName) {
        updates.displayName = displayName;
      }
      if (height && parseFloat(height) !== user?.height) {
        updates.height = parseFloat(height);
      }
      if (weight && parseFloat(weight) !== user?.weight) {
        updates.weight = parseFloat(weight);
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
      }

      // Refresh auth context with new user data
      await refreshProfile();

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const avatarSource = imageUri
    ? { uri: imageUri }
    : user?.photoURL
    ? { uri: user.photoURL }
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handlePickImage} disabled={loading}>
            {avatarSource ? (
              <Avatar.Image size={120} source={avatarSource} />
            ) : (
              <Avatar.Icon
                size={120}
                icon="account"
                style={{ backgroundColor: colors.primary }}
              />
            )}
            <View style={[styles.changePhotoOverlay, { backgroundColor: colors.backdrop }]}>
              <Text style={{ color: colors.surface }}>Change Photo</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TextInput
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          mode="outlined"
          style={styles.input}
          error={!!errors.displayName}
          disabled={loading}
        />
        {errors.displayName && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.displayName}
          </Text>
        )}

        <TextInput
          label="Height (cm)"
          value={height}
          onChangeText={setHeight}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.height}
          disabled={loading}
        />
        {errors.height && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.height}
          </Text>
        )}

        <TextInput
          label="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.weight}
          disabled={loading}
        />
        {errors.weight && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.weight}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Save
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.button}
          >
            Cancel
          </Button>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
    alignItems: 'center',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    opacity: 0.8,
  },
  input: {
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  buttonContainer: {
    marginTop: SPACING.lg,
  },
  button: {
    marginVertical: SPACING.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditProfileScreen;
