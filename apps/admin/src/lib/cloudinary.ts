/**
 * Cloudinary Image Upload Utility
 * Handles image uploads to Cloudinary with proper error handling
 */

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

interface CloudinaryError {
  message: string;
  http_code?: number;
}

/**
 * Upload an image to Cloudinary
 * @param file - The file to upload
 * @param cloudName - Your Cloudinary cloud name
 * @param uploadPreset - Your Cloudinary upload preset (unsigned)
 * @returns Promise with the uploaded image URL and metadata
 */
export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<CloudinaryUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // Optional: Add folder organization
    // formData.append('folder', 'products');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Upload failed with status ${response.status}`
      );
    }

    const data: CloudinaryUploadResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of files to upload
 * @param cloudName - Your Cloudinary cloud name
 * @param uploadPreset - Your Cloudinary upload preset (unsigned)
 * @returns Promise with array of uploaded image URLs
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  cloudName: string,
  uploadPreset: string
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file, cloudName, uploadPreset)
    );
    
    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to upload images to Cloudinary');
  }
}

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): boolean {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a valid image (JPEG, PNG, GIF, WebP)');
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }

  return true;
}

/**
 * Get Cloudinary configuration from environment variables
 * @returns Cloudinary configuration object
 */
export function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary configuration is missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.');
  }

  return {
    cloudName: cloudName || '',
    uploadPreset: uploadPreset || '',
  };
}
