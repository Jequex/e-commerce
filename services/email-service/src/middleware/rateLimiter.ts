import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class InMemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 1,
        resetTime,
      };
    } else {
      this.store[key].count++;
    }

    return this.store[key];
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key] && this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

const store = new InMemoryRateLimitStore();

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { windowMs, maxRequests } = config.rateLimiting;
  
  // Use IP address as the key
  const key = req.ip || req.connection.remoteAddress || 'unknown';
  
  const { count, resetTime } = store.increment(key, windowMs);
  
  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, maxRequests - count).toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  });
  
  if (count > maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`,
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    });
    return;
  }
  
  next();
};

// Custom rate limiter for specific endpoints
export const createRateLimiter = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const { count, resetTime } = store.increment(key, windowMs);
    
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - count).toString(),
      'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    });
    
    if (count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      });
      return;
    }
    
    next();
  };
};