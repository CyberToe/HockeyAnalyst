import { put, del } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

export class BlobStorage {
  private static instance: BlobStorage;
  private token: string;

  private constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN || '';
    if (!this.token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required');
    }
  }

  public static getInstance(): BlobStorage {
    if (!BlobStorage.instance) {
      BlobStorage.instance = new BlobStorage();
    }
    return BlobStorage.instance;
  }

  /**
   * Upload a team image to Vercel Blob storage
   * @param file - The image file to upload
   * @param teamId - The team ID for organizing the file
   * @returns Promise<BlobUploadResult>
   */
  async uploadTeamImage(file: any, teamId: string): Promise<BlobUploadResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = this.getFileExtension(file);
      const filename = `team-${teamId}-${timestamp}${fileExtension}`;
      const pathname = `teams/${teamId}/${filename}`;

      const blob = await put(pathname, file, {
        access: 'public',
        token: this.token,
      });

      return {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
      };
    } catch (error) {
      console.error('Error uploading team image to blob storage:', error);
      throw new Error('Failed to upload team image');
    }
  }

  /**
   * Delete a team image from Vercel Blob storage
   * @param url - The blob URL to delete
   * @returns Promise<void>
   */
  async deleteTeamImage(url: string): Promise<void> {
    try {
      await del(url, { token: this.token });
    } catch (error) {
      console.error('Error deleting team image from blob storage:', error);
      throw new Error('Failed to delete team image');
    }
  }

  /**
   * Extract file extension from file
   * @param file - The file to extract extension from
   * @returns string - The file extension with dot
   */
  private getFileExtension(file: any): string {
    if (file && file.name) {
      const name = file.name;
      const lastDot = name.lastIndexOf('.');
      return lastDot !== -1 ? name.substring(lastDot) : '.jpg';
    }
    
    // For Buffer or files without name, we'll default to .jpg
    // In a real implementation, you might want to detect the MIME type
    return '.jpg';
  }

  /**
   * Convert base64 data URL to Buffer
   * @param dataUrl - The base64 data URL
   * @returns Buffer
   */
  static dataUrlToBuffer(dataUrl: string): Buffer {
    const base64Data = dataUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }

  /**
   * Extract MIME type from base64 data URL
   * @param dataUrl - The base64 data URL
   * @returns string - The MIME type
   */
  static getMimeTypeFromDataUrl(dataUrl: string): string {
    const mimeMatch = dataUrl.match(/data:([^;]+);/);
    return mimeMatch ? mimeMatch[1] : 'image/jpeg';
  }
}

export const blobStorage = BlobStorage.getInstance();