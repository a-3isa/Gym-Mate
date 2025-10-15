import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Storage, Bucket, File } from 'firebase-admin/storage';
import { STORAGE } from '../firebase.module';

/**
 * StorageService
 *
 * Provides methods for Firebase Storage operations including
 * file uploads, downloads, and avatar management.
 */
@Injectable()
export class StorageService {
  private bucket: Bucket;

  constructor(@Inject(STORAGE) private readonly storage: Storage) {
    this.bucket = this.storage.bucket();
  }

  /**
   * Upload a file buffer to Firebase Storage
   * @param buffer File buffer to upload
   * @param destination Destination path in storage
   * @param metadata File metadata
   * @returns Promise<File> The uploaded file reference
   */
  async uploadFile(
    buffer: Buffer,
    destination: string,
    metadata: {
      contentType: string;
      cacheControl?: string;
    },
  ): Promise<File> {
    try {
      const file = this.bucket.file(destination);

      await file.save(buffer, {
        metadata: {
          contentType: metadata.contentType,
          cacheControl: metadata.cacheControl || 'private, max-age=0, no-store',
        },
      });

      return file;
    } catch (error) {
      throw new Error(`Failed to upload file to ${destination}: ${error.message}`);
    }
  }

  /**
   * Get a permanent download URL for a file
   * @param filePath Path to the file in storage
   * @returns Promise<string> Download URL
   */
  async getDownloadUrl(filePath: string): Promise<string> {
    try {
      const file = this.bucket.file(filePath);

      // Get signed URL with very long expiration (essentially permanent)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Far future date
      });

      return url;
    } catch (error) {
      throw new Error(`Failed to get download URL for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Delete a file from storage
   * @param filePath Path to the file in storage
   * @returns Promise<void>
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const file = this.bucket.file(filePath);
      await file.delete();
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Upload a user avatar image
   * @param userId User ID
   * @param buffer Image buffer
   * @param mimetype Image MIME type
   * @returns Promise<{ storagePath: string; downloadUrl: string }>
   */
  async uploadAvatar(
    userId: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ storagePath: string; downloadUrl: string }> {
    try {
      // Validate MIME type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimetype)) {
        throw new Error(
          `Invalid MIME type: ${mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`,
        );
      }

      // Validate file size (max 5MB)
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSizeBytes) {
        throw new Error(`File size exceeds maximum allowed size of 5MB`);
      }

      // Get file extension from MIME type
      const extension = this.getMimeExtension(mimetype);
      const version = new Date().getTime();
      const uniqueSuffix = randomUUID();
      const storagePath = `avatars/${userId}/${version}-${uniqueSuffix}.${extension}`;

      // Upload the file with appropriate metadata
      const file = await this.uploadFile(buffer, storagePath, {
        contentType: mimetype,
        cacheControl: 'private, max-age=0, no-store',
      });

      // Get the download URL
      const downloadUrl = await this.getDownloadUrl(storagePath);

      return {
        storagePath,
        downloadUrl,
      };
    } catch (error) {
      throw new Error(`Failed to upload avatar for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Map MIME types to file extensions
   * @param mimetype MIME type
   * @returns File extension
   */
  private getMimeExtension(mimetype: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    return mimeMap[mimetype] || 'jpg';
  }
}
