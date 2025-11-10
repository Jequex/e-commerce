import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
      token: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  email: EmailConfig;
  redis: RedisConfig;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  email: {
    provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'ses') || 'smtp',
    
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        token: process.env.SMTP_TOKEN || '',
      },
    },
    
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
    
    ses: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Jequex E-commerce',
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@jequex.com',
    },
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Validate required configuration
const validateConfig = () => {
  const errors: string[] = [];
  
  if (config.email.provider === 'smtp') {
    if (!config.email.smtp?.auth.user) errors.push('SMTP_USER is required');
    if (!config.email.smtp?.auth.pass) errors.push('SMTP_PASS is required');
  }
  
  if (config.email.provider === 'sendgrid') {
    if (!config.email.sendgrid?.apiKey) errors.push('SENDGRID_API_KEY is required');
  }
  
  if (config.email.provider === 'ses') {
    if (!config.email.ses?.accessKeyId) errors.push('AWS_ACCESS_KEY_ID is required');
    if (!config.email.ses?.secretAccessKey) errors.push('AWS_SECRET_ACCESS_KEY is required');
  }
  
  if (!config.email.from.email) errors.push('EMAIL_FROM_ADDRESS is required');
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

export { config, validateConfig };