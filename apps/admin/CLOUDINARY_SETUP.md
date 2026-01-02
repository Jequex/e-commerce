# Cloudinary Image Upload Setup

This document explains how to set up Cloudinary for image uploads in the admin app.

## Environment Variables

Add the following environment variables to your admin app. You can create a `.env.local` file in the `apps/admin` directory:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

## Getting Your Cloudinary Credentials

### 1. Create a Cloudinary Account
- Go to [https://cloudinary.com](https://cloudinary.com)
- Sign up for a free account

### 2. Get Your Cloud Name
- After logging in, you'll find your **Cloud Name** on the dashboard
- Copy this value and use it for `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

### 3. Create an Upload Preset (Unsigned)
- Go to **Settings** → **Upload** → **Upload presets**
- Click "Add upload preset"
- Set the following:
  - **Signing Mode**: Unsigned (important!)
  - **Preset name**: Choose a name (e.g., `products_preset`)
  - **Folder**: Optional - you can set a folder like `products` to organize images
  - **Tags**: Optional - add tags like `product` for better organization
- Click "Save"
- Copy the preset name and use it for `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### 4. Optional Configuration
You can configure additional settings in the upload preset:
- **Max file size**: Set a maximum file size limit
- **Allowed formats**: Restrict to specific image formats
- **Image transformations**: Auto-resize, optimize, etc.
- **Auto-tagging**: Enable AI-based auto-tagging

## Features Implemented

### Image Upload Component
- Drag and drop support
- Multiple image uploads (up to 5 images)
- Image preview with remove functionality
- File size validation (up to 5MB per image)
- File type validation (JPEG, PNG, GIF, WebP)
- Primary image indicator (first image is primary)
- Upload progress indication

### Add Product Modal
- Image upload integration
- Images are uploaded to Cloudinary
- Uploaded URLs are saved with the product

### Edit Product Modal
- Displays existing product images
- Add new images
- Remove existing images
- Update product with new image URLs

## Usage

1. Set up your environment variables as described above
2. Restart your development server
3. Navigate to the Products page in the admin app
4. Click "Add Product" or "Edit" on an existing product
5. Upload images using drag-and-drop or the browse button
6. Images will be automatically uploaded to Cloudinary
7. The secure URLs will be saved with your product

## Security Notes

- The upload preset is unsigned, which means anyone with your preset name can upload
- Consider implementing additional security measures:
  - Use signed uploads for production
  - Implement upload restrictions
  - Set up webhook notifications for upload events
  - Monitor your Cloudinary usage

## Troubleshooting

### Images not uploading
- Check that environment variables are set correctly
- Verify your upload preset is set to "Unsigned"
- Check browser console for errors
- Ensure you're not exceeding Cloudinary's free tier limits

### CORS errors
- Cloudinary should handle CORS automatically
- If issues persist, check your Cloudinary security settings

## Migration Note

If you have existing products with images stored elsewhere, you'll need to migrate them to Cloudinary. The product service should be updated to handle the images array properly.
