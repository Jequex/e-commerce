import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for merging classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Authentication utilities
export const auth = {
  hashPassword: async (password: string): Promise<string> => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  },

  verifyPassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
  },

  generateToken: (payload: object, secret: string, expiresIn = '24h'): string => {
    return jwt.sign(payload, secret, { expiresIn });
  },

  verifyToken: (token: string, secret: string): any => {
    return jwt.verify(token, secret);
  },

  generateRefreshToken: (): string => {
    return nanoid(64);
  },
};

// ID generation utilities
export const id = {
  generate: (length = 21): string => nanoid(length),
  generateNumeric: (length = 8): string => {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  generateOrderNumber: (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  },
};

// String utilities
export const strings = {
  slugify: (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  },

  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  },

  formatCurrency: (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100); // Assuming amounts are stored in cents
  },

  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  },
};

// Date utilities
export const dates = {
  isValidDate: (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  },

  formatDate: (date: Date, locale = 'en-US'): string => {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  formatDateTime: (date: Date, locale = 'en-US'): string => {
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  isExpired: (expiryDate: Date): boolean => {
    return new Date() > expiryDate;
  },
};

// Number utilities
export const numbers = {
  formatPrice: (price: number): string => {
    return (price / 100).toFixed(2);
  },

  calculateTax: (subtotal: number, taxRate: number): number => {
    return Math.round(subtotal * taxRate);
  },

  calculateDiscount: (amount: number, discountPercent: number): number => {
    return Math.round(amount * (discountPercent / 100));
  },

  roundToNearest: (value: number, nearest: number): number => {
    return Math.round(value / nearest) * nearest;
  },
};

// Array utilities
export const arrays = {
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
};

// Object utilities
export const objects = {
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  isEmpty: (obj: any): boolean => {
    return obj == null || Object.keys(obj).length === 0;
  },

  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },
};

// Validation schemas using Zod
export const schemas = {
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
  url: z.string().url(),
  
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),

  address: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    company: z.string().max(100).optional(),
    address1: z.string().min(1).max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2),
    phone: z.string().optional(),
  }),

  productCreate: z.object({
    name: z.string().min(1).max(200),
    description: z.string().min(1),
    shortDescription: z.string().max(500).optional(),
    brand: z.string().min(1).max(100),
    categoryId: z.string(),
    tags: z.array(z.string()).default([]),
    weight: z.number().positive().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
  }),
};

// Error handling utilities
export const errors = {
  createError: (message: string, code?: string, statusCode = 500) => {
    const error = new Error(message) as any;
    error.code = code;
    error.statusCode = statusCode;
    return error;
  },

  isHttpError: (error: any): boolean => {
    return error && typeof error.statusCode === 'number';
  },

  formatValidationErrors: (zodError: z.ZodError): Record<string, string> => {
    const errors: Record<string, string> = {};
    zodError.errors.forEach(err => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return errors;
  },
};

// Rate limiting utilities
export const rateLimit = {
  createKey: (identifier: string, window: string): string => {
    return `rate_limit:${identifier}:${window}`;
  },

  calculateWindow: (windowSize: number): string => {
    const now = Date.now();
    const windowStart = Math.floor(now / windowSize) * windowSize;
    return windowStart.toString();
  },
};

// Cache utilities
export const cache = {
  createKey: (...parts: string[]): string => {
    return parts.filter(Boolean).join(':');
  },

  serializeValue: (value: any): string => {
    return JSON.stringify(value);
  },

  deserializeValue: <T>(serialized: string): T => {
    return JSON.parse(serialized);
  },
};

// Environment utilities
export const env = {
  isDevelopment: (): boolean => process.env.NODE_ENV === 'development',
  isProduction: (): boolean => process.env.NODE_ENV === 'production',
  isTest: (): boolean => process.env.NODE_ENV === 'test',
  
  requireEnv: (key: string): string => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  },

  getEnv: (key: string, defaultValue?: string): string | undefined => {
    return process.env[key] || defaultValue;
  },
};

// Retry utilities
export const retry = {
  withExponentialBackoff: async <T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelay = 1000
  ): Promise<T> => {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    
    throw new Error('Max attempts reached');
  },
};