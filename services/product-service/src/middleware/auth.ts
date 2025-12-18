import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    storeId?: string;
  };
}

// Authentication middleware for product service
// Verifies JWT tokens issued by the auth service
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
        message: 'Please provide an authentication token'
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
        role: decoded.role,
        storeId: decoded.storeId
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please login again'
        });
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
          message: 'The provided token is invalid'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH',
        message: 'You must be authenticated to access this resource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole(['admin', 'super_admin']);

// Store owner or admin middleware
export const requireStoreOwnerOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NO_AUTH'
    });
  }

  const storeId = req.params.storeId || req.body.storeId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const isStoreOwner = req.user.storeId === storeId;

  if (!isAdmin && !isStoreOwner) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You can only manage products for your own store'
    });
  }

  next();
};

export const requireCustomer = requireRole(['customer', 'admin', 'super_admin']);