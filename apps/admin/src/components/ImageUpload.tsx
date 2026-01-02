'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import * as Icons from '@radix-ui/react-icons';
import { 
  uploadMultipleToCloudinary, 
  validateImageFile,
  getCloudinaryConfig,
  deleteFromCloudinary
} from '@/lib/cloudinary';
import { toast } from 'react-toastify';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  storeName?: string;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 5,
  storeName,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check if cloudinary is configured
    if (!cloudName || !uploadPreset) {
      toast.error('Cloudinary is not configured. Please set up environment variables.');
      return;
    }

    // Check if adding these files would exceed max images
    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    try {
      setUploading(true);

      // Validate all files
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        validateImageFile(file, maxSizeMB);
      }

      // Upload to Cloudinary with store folder
      const folder = storeName ? `products/${storeName}` : 'products';
      const uploadedUrls = await uploadMultipleToCloudinary(
        fileArray,
        cloudName,
        uploadPreset,
        folder
      );

      // Add new URLs to existing images
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload images'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Optimistically update UI
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Try to delete from Cloudinary in background
    if (cloudName && imageUrl.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(imageUrl);
        toast.success('Image deleted from cloud storage');
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
        toast.warning('Image removed from UI but may still exist in cloud storage');
      }
    }
  };

  // Image reordering handlers
  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleImageDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove from old position
    newImages.splice(draggedIndex, 1);
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    onImagesChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success('Images reordered');
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading images...
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Icons.ImageIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag and drop images here, or{' '}
                  <button
                    type="button"
                    onClick={handleButtonClick}
                    disabled={images.length >= maxImages}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, GIF, WebP up to {maxSizeMB}MB (Max {maxImages} images)
                </p>
              </div>
              {images.length > 0 && (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {images.length} / {maxImages} images uploaded
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Drag images to reorder (first image is the primary image)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div
                key={imageUrl}
                draggable
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragLeave={handleImageDragLeave}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragEnd={handleImageDragEnd}
                className={`relative group aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 dark:bg-gray-800 cursor-move transition-all ${
                  draggedIndex === index
                    ? 'opacity-50 scale-95'
                    : dragOverIndex === index
                    ? 'border-blue-500 scale-105'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transform hover:scale-110 transition-transform"
                    title="Remove image"
                  >
                    <Icons.TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
