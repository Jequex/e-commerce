import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { users, userSessions, apiKeys } from '../schema/auth';
import { eq, and } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
  };
  session?: {
    id: string;
    token: string;
    expiresAt: Date;
  };
}

// JWT Authentication middleware for auth service
export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }

  // Verify JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      code: 'CONFIG_ERROR'
    });
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role
    };

  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  next();
};

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if session exists and is active
    const [session] = await db
      .select({
        id: userSessions.id,
        userId: userSessions.userId,
        token: userSessions.token,
        expiresAt: userSessions.expiresAt,
        isActive: userSessions.isActive,
      })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.token, token),
          eq(userSessions.isActive, true)
        )
      );

    if (!session) {
      return res.status(401).json({
        error: 'Session not found or inactive',
        code: 'INVALID_SESSION'
      });
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      // Mark session as inactive
      await db
        .update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.id, session.id));

      return res.status(401).json({
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    // Get user information
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Update last used timestamp
    await db
      .update(userSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(userSessions.id, session.id));

    // Attach user and session to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    req.session = {
      id: session.id,
      token: session.token,
      expiresAt: session.expiresAt,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Optional auth middleware (doesn't fail if no token provided)
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  // Use the same logic as authMiddleware but don't fail if invalid
  try {
    await authMiddleware(req, res, next);
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole(['admin']);

// Customer or higher middleware
export const requireCustomer = requireRole(['customer', 'admin', 'moderator']);

// API key authentication middleware
export const apiKeyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'NO_API_KEY'
      });
    }

    // Hash the API key and check against database
    const hashedKey = await bcrypt.hash(apiKey, 10);

    // Find the API key in the database
    const [validKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, hashedKey),
          eq(apiKeys.isActive, true)
        )
      )
      .limit(1);

    if (!validKey) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check expiration
    if (validKey.expiresAt && new Date() > validKey.expiresAt) {
      return res.status(401).json({
        error: 'API key expired',
        code: 'API_KEY_EXPIRED'
      });
    }

    // Attach API key info to request
    req.user = {
      id: 'api-key-user',
      email: 'api@system.com',
      role: 'api',
      permissions: (validKey.permissions as string[]) || [],
    };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};