import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  
  // External Services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Search
  ELASTICSEARCH_URL: z.string().url().optional(),
  
  // Message Queue
  KAFKA_BROKERS: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
});

export type Environment = z.infer<typeof envSchema>;

let env: Environment;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  process.exit(1);
}

export { env };

// Database configuration
export const database = {
  url: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production',
  pool: {
    min: 2,
    max: 10,
  },
} as const;

// Redis configuration
export const redis = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
} as const;

// JWT configuration
export const jwt = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
} as const;

// Payment configuration
export const payments = {
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  paypal: {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    mode: env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  },
} as const;

// Email configuration
export const email = {
  smtp: {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    secure: env.SMTP_PORT === '465',
    auth: env.SMTP_USER && env.SMTP_PASSWORD ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    } : undefined,
  },
} as const;

// File storage configuration
export const storage = {
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucket: env.AWS_S3_BUCKET,
  },
} as const;

// Search configuration
export const search = {
  elasticsearch: {
    node: env.ELASTICSEARCH_URL,
  },
} as const;

// Message queue configuration
export const messageQueue = {
  kafka: {
    brokers: env.KAFKA_BROKERS ? env.KAFKA_BROKERS.split(',') : [],
  },
} as const;

// Rate limiting configuration
export const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
} as const;

// CORS configuration
export const cors = {
  origin: env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://admin.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
} as const;

// Server configuration
export const server = {
  port: parseInt(env.PORT, 10),
  host: '0.0.0.0',
  bodySizeLimit: '10mb',
} as const;

// Cache configuration
export const cache = {
  ttl: {
    short: 5 * 60, // 5 minutes
    medium: 30 * 60, // 30 minutes
    long: 24 * 60 * 60, // 24 hours
  },
} as const;

// Monitoring configuration
export const monitoring = {
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
  },
} as const;

// Feature flags
export const features = {
  enableRegistration: true,
  enableGuestCheckout: true,
  enableWishlist: true,
  enableReviews: true,
  enableRecommendations: true,
  enableNotifications: true,
} as const;