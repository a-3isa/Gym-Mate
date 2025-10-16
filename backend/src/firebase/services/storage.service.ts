import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Storage } from 'firebase-admin/storage';
import type { Bucket, File } from '@google-cloud/storage';
import { STORAGE } from '../firebase.tokens';

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
   * @returns Promise<{ file: File; downloadUrl: string; downloadToken?: string }> Upload result
   */
  async uploadFile(
    buffer: Buffer,
    destination: string,
    metadata: {
      contentType: string;
      cacheControl?: string;
      public?: boolean;
    },
  ): Promise<{ file: File; downloadUrl: string; downloadToken?: string }> {
    try {
      const storageFile: File = this.bucket.file(destination);
      const shouldBePublic = metadata.public ?? false;
      let downloadToken: string | undefined;

      const metadataOptions: {
        contentType: string;
        cacheControl: string;
        metadata?: Record<string, string>;
      } = {
        contentType: metadata.contentType,
        cacheControl: metadata.cacheControl ?? 'public, max-age=31536000, immutable',
      };

      if (!shouldBePublic) {
        downloadToken = randomUUID();
        metadataOptions.metadata = {
          firebaseStorageDownloadTokens: downloadToken,
        };
      }

      await storageFile.save(buffer, {
        metadata: metadataOptions,
      });

      if (shouldBePublic) {
        await storageFile.makePublic();
      }

      let signedUrl: string | undefined;

      const isEmulator = !!(
        process.env.FIREBASE_STORAGE_EMULATOR_HOST || process.env.STORAGE_EMULATOR_HOST
      );

      if (!shouldBePublic && !isEmulator) {
        const [url] = await storageFile.getSignedUrl({ action: 'read', expires: '03-09-2491' });
        signedUrl = url;
      }

      const downloadUrl = await this.getDownloadUrl(destination, {
        isPublic: shouldBePublic,
        downloadToken,
        signedUrl,
      });

      return { file: storageFile, downloadUrl, downloadToken };
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      throw new Error(`Failed to upload file to ${destination}: ${message}`);
    }
  }

  /**
   * Get a permanent download URL for a file
   * @param filePath Path to the file in storage
   * @returns Promise<string> Download URL
   */
  getDownloadUrl(
    filePath: string,
    options: { isPublic?: boolean; downloadToken?: string; signedUrl?: string } = {},
  ): Promise<string> {
    try {
      const encodedPath = filePath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      const rawEmulatorHost =
        process.env.FIREBASE_STORAGE_EMULATOR_HOST || process.env.STORAGE_EMULATOR_HOST;

      if (options.signedUrl) {
        return Promise.resolve(options.signedUrl);
      }

      if (rawEmulatorHost) {
        const baseUrl = rawEmulatorHost.startsWith('http')
          ? rawEmulatorHost
          : `http://${rawEmulatorHost}`;
        const emulatorUrl = `${baseUrl.replace(/\/$/, '')}/v0/b/${this.bucket.name}/o/${encodedPath}?alt=media`;
        return Promise.resolve(
          options.downloadToken ? `${emulatorUrl}&token=${options.downloadToken}` : emulatorUrl,
        );
      }

      if (options.isPublic) {
        return Promise.resolve(`https://storage.googleapis.com/${this.bucket.name}/${encodedPath}`);
      }

      if (options.downloadToken) {
        return Promise.resolve(
          `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodedPath}?alt=media&token=${options.downloadToken}`,
        );
      }

      throw new Error(`Missing signed URL or download token for private file ${filePath}`);
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      throw new Error(`Failed to get download URL for ${filePath}: ${message}`);
    }
  }

  /**
   * Delete a file from storage
   * @param filePath Path to the file in storage
   * @returns Promise<void>
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const storageFile = this.bucket.file(filePath);
      await storageFile.delete();
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      throw new Error(`Failed to delete file ${filePath}: ${message}`);
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
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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
      const { downloadUrl } = await this.uploadFile(buffer, storagePath, {
        contentType: mimetype,
        cacheControl: 'public, max-age=31536000, immutable',
        public: false,
      });

      return {
        storagePath,
        downloadUrl,
      };
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      throw new Error(`Failed to upload avatar for user ${userId}: ${message}`);
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
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    return mimeMap[mimetype] || 'jpg';
  }
}
