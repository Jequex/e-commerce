# Quick Start: Cloudinary Image Upload

## Step 1: Get Cloudinary Credentials (5 minutes)

1. Go to https://cloudinary.com and sign up
2. After login, copy your **Cloud Name** from the dashboard
3. Go to Settings → Upload → Upload presets
4. Click "Add upload preset"
5. Set **Signing Mode** to **Unsigned**
6. Give it a name (e.g., `products_preset`)
7. Click Save and copy the preset name

## Step 2: Configure Environment Variables

Create or edit `apps/admin/.env.local`:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name_here
```

**Example:**
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=myshop
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=products_preset
```

## Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Test It Out

1. Open admin app at http://localhost:3006
2. Navigate to Products page
3. Click "Add Product" or edit an existing product
4. Drag and drop images or click browse
5. Images should upload and show previews
6. Submit the form

## Troubleshooting

**Problem:** "Cloudinary is not configured" error  
**Solution:** Make sure environment variables are set and server is restarted

**Problem:** Images not uploading  
**Solution:** 
- Check upload preset is set to "Unsigned"
- Verify cloud name and preset name are correct
- Check browser console for specific errors

**Problem:** CORS errors  
**Solution:** Cloudinary handles CORS automatically. Check your account settings.

**Problem:** File size errors  
**Solution:** Images must be under 5MB. Compress large images or adjust the limit in the component.

## Usage Tips

- First image uploaded becomes the primary product image
- You can upload up to 5 images per product
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 5MB per image
- Click the trash icon on hover to remove images
- Images are stored securely on Cloudinary's CDN

## Component API

If you want to use the ImageUpload component elsewhere:

```tsx
import ImageUpload from '@/components/ImageUpload';

<ImageUpload
  images={images}                    // Array of image URLs
  onImagesChange={setImages}         // Callback when images change
  maxImages={5}                      // Maximum number of images (optional)
  maxSizeMB={5}                      // Max file size in MB (optional)
/>
```

## Need Help?

- Full documentation: `apps/admin/CLOUDINARY_SETUP.md`
- Implementation details: `docs/features/IMAGE-UPLOAD-IMPLEMENTATION.md`
- Cloudinary docs: https://cloudinary.com/documentation
