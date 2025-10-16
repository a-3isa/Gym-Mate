import apiClient from './client';
import { User } from '../../types/models';

export interface PublicUser {
  uid: string;
  displayName?: string;
  photoURL?: string;
  email: string;
}

/**
 * Update user profile with new information
 * @param updates Profile fields to update (displayName, height, weight)
 * @returns Promise<User> Updated user object
 */
export async function updateProfile(updates: {
  displayName?: string;
  height?: number;
  weight?: number;
}): Promise<User> {
  try {
    const response = await apiClient.patch<User>('/auth/profile', updates);
    return response.data;
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
}

/**
 * Upload user avatar image
 * @param imageUri URI of the image to upload (from image picker)
 * @returns Promise<User> Updated user object with new photoURL
 */
export async function uploadAvatar(
  imageUri: string,
  options?: {
    fileName?: string | null;
    mimeType?: string | null;
    type?: string | null;
  },
): Promise<User> {
  try {
    // Create FormData and append the image
    const formData = new FormData();
    const sanitizeFileName = (value?: string | null): string | undefined => {
      if (!value || typeof value !== 'string') {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const extractExtension = (value?: string): string | undefined => {
      if (!value) {
        return undefined;
      }
      const cleaned = value.split('?')[0];
      const segments = cleaned.split('.');
      if (segments.length < 2) {
        return undefined;
      }
      return segments.pop()?.toLowerCase();
    };

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const preferredFileName = sanitizeFileName(options?.fileName ?? null);
    const extensionFromName = extractExtension(preferredFileName);
    const extensionFromUri = extractExtension(imageUri);
    let resolvedExtension = extensionFromName ?? extensionFromUri;
    if (!resolvedExtension || !allowedExtensions.includes(resolvedExtension)) {
      resolvedExtension = 'jpg';
    }
    if (resolvedExtension === 'jpeg') {
      resolvedExtension = 'jpg';
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const candidateMimeType = options?.mimeType ?? options?.type ?? undefined;
    let resolvedMimeType = candidateMimeType && allowedMimeTypes.includes(candidateMimeType)
      ? candidateMimeType
      : undefined;

    if (!resolvedMimeType) {
      switch (resolvedExtension) {
        case 'png':
          resolvedMimeType = 'image/png';
          break;
        case 'webp':
          resolvedMimeType = 'image/webp';
          break;
        default:
          resolvedMimeType = 'image/jpeg';
      }
    }

    const filename = preferredFileName ?? `avatar_${Date.now()}.${resolvedExtension}`;

    // For React Native, append the file metadata directly
    formData.append('avatar', {
      uri: imageUri,
      type: resolvedMimeType,
      name: filename,
    } as any);

    const uploadResponse = await apiClient.post<User>('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return uploadResponse.data;
  } catch (error: any) {
    console.error('Failed to upload avatar:', error);
    if (error.response?.status === 400) {
      throw new Error('File size exceeds 5MB limit or invalid format');
    }
    throw new Error(error.response?.data?.message || 'Failed to upload avatar');
  }
}

/**
 * Get list of user's friends
 * @returns Promise<User[]> Array of friend User objects
 */
export async function getFriends(): Promise<User[]> {
  try {
    const response = await apiClient.get<User[]>('/auth/friends');
    return response.data;
  } catch (error: any) {
    console.error('Failed to get friends:', error);
    throw new Error(error.response?.data?.message || 'Failed to retrieve friends');
  }
}

/**
 * Search for a user by email address
 * @param email Email address to search for
 * @returns Promise<PublicUser | null> Found user or null
 */
export async function searchUserByEmail(email: string): Promise<PublicUser | null> {
  try {
    const response = await apiClient.get<PublicUser | null>('/auth/search', {
      params: { email },
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to search user:', error);
    // Return null for any error to prevent enumeration
    return null;
  }
}

/**
 * Add a friend by email address
 * @param email Email of the user to add as friend
 * @returns Promise with success message and updated friends list
 */
export async function addFriend(email: string): Promise<{
  message: string;
  friends: string[];
}> {
  try {
    const response = await apiClient.post<{
      message: string;
      friends: string[];
    }>('/auth/friends', { email });
    return response.data;
  } catch (error: any) {
    console.error('Failed to add friend:', error);
    if (error.response?.status === 404) {
      throw new Error('User not found');
    } else if (error.response?.status === 409) {
      throw new Error('Already friends with this user');
    } else if (error.response?.status === 400) {
      throw new Error('Cannot add yourself as a friend');
    }
    throw new Error(error.response?.data?.message || 'Failed to add friend');
  }
}

/**
 * Remove a friend from the friends list
 * @param friendUid UID of the friend to remove
 * @returns Promise with success message
 */
export async function removeFriend(friendUid: string): Promise<{
  message: string;
}> {
  try {
    const response = await apiClient.delete<{
      message: string;
    }>(`/auth/friends/${friendUid}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to remove friend:', error);
    throw new Error(error.response?.data?.message || 'Failed to remove friend');
  }
}
