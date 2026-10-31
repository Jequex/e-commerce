'use client';

import React, { useState, useRef, DragEvent } from 'react';
import * as Icons from '@radix-ui/react-icons';
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
  maxImages = 8,
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    const fileArray = Array.from(files);

    // Validate size and type
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" is not a valid image format`);
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds maximum allowed size of ${maxSizeMB}MB`);
        return;
      }
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token') || '';
      const formData = new FormData();
      fileArray.forEach((file) => {
        formData.append('files', file);
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/products/upload`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload images to MinIO');
      }

      const uploadedUrls: string[] = data.urls || (data.files ? data.files.map((f: any) => f.url) : []);
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded to MinIO successfully`);
    } catch (err: any) {
      console.error('MinIO upload error:', err);
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onImagesChange(images.filter((_, i) => i !== indexToRemove));
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

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-gray-800/50'
        } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {uploading ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Uploading to local MinIO storage...
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400">
                <Icons.UploadIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Click to upload or drag & drop product photos
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  PNG, JPG, WebP, GIF up to {maxSizeMB}MB (Stored in MinIO) • {images.length}/{maxImages} uploaded
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Thumbnails Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-1">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-gray-900"
            >
              <img
                src={url}
                alt={`Product image ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-90 group-hover:opacity-100 transition shadow"
                title="Remove image"
              >
                <Icons.Cross2Icon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
