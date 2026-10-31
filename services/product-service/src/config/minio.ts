import { Client } from 'minio';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const minioEndpoint = process.env.MINIO_ENDPOINT || (process.env.NODE_ENV === 'production' ? 'minio' : 'minio');
const minioPort = parseInt(process.env.MINIO_PORT || '9000', 10);
const minioUseSSL = process.env.MINIO_USE_SSL === 'true';
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadminpassword';
export const BUCKET_NAME = process.env.MINIO_BUCKET || 'products';

// Gateway public URL for accessing media files
export const MEDIA_PUBLIC_BASE_URL = process.env.MEDIA_PUBLIC_URL || 'http://localhost:8080/media';

export const minioClient = new Client({
  endPoint: minioEndpoint,
  port: minioPort,
  useSSL: minioUseSSL,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
});

/**
 * Initialize MinIO bucket and ensure public read access policy
 */
export async function initMinio(): Promise<void> {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`[MinIO] Bucket "${BUCKET_NAME}" created successfully`);
    }

    // Set public read policy for products bucket
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetBucketLocation', 's3:ListBucket'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}`],
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`[MinIO] Public read policy set for bucket "${BUCKET_NAME}"`);
  } catch (error) {
    console.error('[MinIO] Initialization warning (will retry on upload):', error);
  }
}

/**
 * Upload a file buffer to MinIO bucket and return its public URL
 */
export async function uploadFileToMinio(
  buffer: Buffer,
  originalname: string,
  mimetype: string
): Promise<{ url: string; fileName: string; size: number }> {
  // Ensure bucket exists
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await initMinio();
    }
  } catch {
    // Retry init
    await initMinio();
  }

  const extension = path.extname(originalname) || (mimetype.includes('video') ? '.mp4' : '.jpg');
  const safeBaseName = path.basename(originalname, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${Date.now()}-${uuidv4().slice(0, 8)}-${safeBaseName}${extension}`;

  await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
    'Content-Type': mimetype,
  });

  const url = `${MEDIA_PUBLIC_BASE_URL}/${fileName}`;

  return {
    url,
    fileName,
    size: buffer.length,
  };
}
