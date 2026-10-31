'use client';

import React, { useState, useRef } from 'react';
import * as Icons from '@radix-ui/react-icons';
import { toast } from 'react-toastify';

interface VideoUploadProps {
  videoUrl: string | null;
  onVideoChange: (url: string | null) => void;
  maxSizeMB?: number;
}

export default function VideoUpload({
  videoUrl,
  onVideoChange,
  maxSizeMB = 100,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate type and size
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, WebM, MOV, etc.)');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Video exceeds the maximum allowed size of ${maxSizeMB}MB`);
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('files', file);

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
        throw new Error(data.error || 'Failed to upload demo video to MinIO');
      }

      const uploadedUrl = data.url || (data.urls && data.urls[0]) || (data.files && data.files[0]?.url);
      if (!uploadedUrl) {
        throw new Error('No video URL returned from server');
      }

      onVideoChange(uploadedUrl);
      toast.success('Demo video uploaded to MinIO successfully');
    } catch (err: any) {
      console.error('Video upload error:', err);
      toast.error(err.message || 'Demo video upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={(e) => handleVideoFile(e.target.files)}
        className="hidden"
        disabled={uploading}
      />

      {videoUrl ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/60 space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-56 flex items-center justify-center">
            <video
              src={videoUrl}
              controls
              className="w-full h-full max-h-56 object-contain"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Icons.CheckCircledIcon className="w-4 h-4" />
              <span>1 Demo Video Attached (Stored in MinIO)</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2.5 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition font-medium"
              >
                Change Video
              </button>
              <button
                type="button"
                onClick={() => onVideoChange(null)}
                className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-purple-50/20 dark:bg-purple-950/10 ${
            uploading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-1.5">
            {uploading ? (
              <div className="flex flex-col items-center space-y-2 py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Uploading demo video to MinIO...
                </p>
              </div>
            ) : (
              <>
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-400">
                  <Icons.VideoIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Upload 1 Product Demo Video
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    MP4, WebM, or MOV up to {maxSizeMB}MB (Stored locally in MinIO)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
