# Image Upload Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Admin User                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Products Page                                 │
│  /apps/admin/src/app/[locale]/products/page.tsx                 │
└────────────┬──────────────────────────────┬─────────────────────┘
             │                              │
             ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   AddProductModal        │   │   EditProductModal       │
│  (Add Product)           │   │  (Edit Product)          │
└──────────┬───────────────┘   └──────────┬───────────────┘
           │                              │
           │  Both use ImageUpload Component
           │                              │
           └──────────────┬───────────────┘
                          ▼
           ┌────────────────────────────────┐
           │    ImageUpload Component       │
           │  /components/ImageUpload.tsx   │
           │                                │
           │  Features:                     │
           │  • Drag & Drop                 │
           │  • File Validation             │
           │  • Preview Grid                │
           │  • Remove Images               │
           └─────────────┬──────────────────┘
                         │
                         │ Uses
                         ▼
           ┌────────────────────────────────┐
           │   Cloudinary Utility           │
           │   /lib/cloudinary.ts           │
           │                                │
           │  Functions:                    │
           │  • uploadToCloudinary()        │
           │  • uploadMultipleToCloudinary()│
           │  • validateImageFile()         │
           │  • getCloudinaryConfig()       │
           └─────────────┬──────────────────┘
                         │
                         │ Uploads to
                         ▼
           ┌────────────────────────────────┐
           │      Cloudinary API            │
           │  https://api.cloudinary.com    │
           │                                │
           │  Returns: Secure Image URLs    │
           └─────────────┬──────────────────┘
                         │
                         │ URLs saved
                         ▼
           ┌────────────────────────────────┐
           │    Product Service API         │
           │  /services/product-service     │
           │                                │
           │  Saves images[] to database    │
           └────────────────────────────────┘
```

## Data Flow

### Add Product Flow
```
1. User clicks "Add Product"
   ↓
2. AddProductModal opens with empty form
   ↓
3. User drags/selects images
   ↓
4. ImageUpload validates files (size, type)
   ↓
5. Files uploaded to Cloudinary via utility
   ↓
6. Cloudinary returns secure URLs
   ↓
7. URLs stored in images[] state
   ↓
8. User fills form and submits
   ↓
9. Product data + images[] sent to API
   ↓
10. Product saved with image URLs
```

### Edit Product Flow
```
1. User clicks "Edit" on product
   ↓
2. EditProductModal opens with product data
   ↓
3. Existing images loaded into ImageUpload
   ↓
4. User can add/remove images
   ↓
5. New images uploaded to Cloudinary
   ↓
6. URLs added to images[] array
   ↓
7. Removed images filtered from array
   ↓
8. User submits form
   ↓
9. Updated product data + images[] sent to API
   ↓
10. Product updated with new image URLs
```

## File Structure

```
apps/admin/
├── src/
│   ├── components/
│   │   ├── ImageUpload.tsx         # Reusable upload component
│   │   └── modals/
│   │       ├── AddProductModal.tsx # Uses ImageUpload
│   │       └── EditProductModal.tsx # Uses ImageUpload
│   ├── lib/
│   │   └── cloudinary.ts           # Upload utilities
│   └── app/
│       └── [locale]/
│           └── products/
│               └── page.tsx        # Products page
├── .env.local                      # Environment config (create this)
├── .env.local.example              # Example env file
├── CLOUDINARY_SETUP.md             # Setup guide
└── QUICKSTART_IMAGE_UPLOAD.md      # Quick start guide
```

## State Management

### AddProductModal State
```typescript
const [images, setImages] = useState<string[]>([]);
// - Initialized as empty array
// - Populated when user uploads images
// - Sent to API on form submit
```

### EditProductModal State
```typescript
const [images, setImages] = useState<string[]>([]);
// - Initialized from product.images on modal open
// - User can add/remove images
// - Updated array sent to API on form submit
```

## Environment Variables

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
├── Used by: cloudinary.ts
├── Source: Cloudinary Dashboard
└── Purpose: Identify your Cloudinary account

NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
├── Used by: cloudinary.ts
├── Source: Cloudinary Upload Settings
└── Purpose: Configure unsigned uploads
```

## API Contract

### Product Data Structure
```typescript
{
  name: string;
  description: string;
  price: number;
  // ... other fields ...
  images: string[];  // ← Array of Cloudinary URLs
}
```

### Example Product with Images
```json
{
  "name": "Sample Product",
  "description": "A great product",
  "price": 29.99,
  "images": [
    "https://res.cloudinary.com/demo/image/upload/sample1.jpg",
    "https://res.cloudinary.com/demo/image/upload/sample2.jpg"
  ]
}
```

## Security Considerations

```
Client-Side Validation
├── File type check (JPEG, PNG, GIF, WebP)
├── File size check (max 5MB)
└── Max images count (5 images)

Cloudinary Security
├── Unsigned uploads (easy setup, less secure)
├── Upload preset restrictions
└── Cloudinary account limits

Recommended for Production
├── Switch to signed uploads
├── Add server-side validation
├── Implement rate limiting
└── Monitor Cloudinary usage
```

## Error Handling

```
ImageUpload Component
├── File validation errors → Toast notification
├── Upload failures → Toast notification
└── Missing config → Warning message

Cloudinary Utility
├── Network errors → Error thrown
├── Invalid response → Error thrown
└── Validation errors → Error thrown

Modal Components
├── API errors → Toast notification
└── Form validation → Browser validation
```

## Testing Points

1. **File Upload**
   - Single image upload
   - Multiple images upload
   - Drag and drop
   - Click to browse

2. **Validation**
   - Large file (>5MB)
   - Invalid file type
   - Too many images (>5)

3. **Image Management**
   - Remove image
   - Add to existing images
   - Preview display

4. **Form Integration**
   - Submit with images
   - Submit without images
   - Update existing product

5. **Error Scenarios**
   - Missing config
   - Network failure
   - Invalid credentials
