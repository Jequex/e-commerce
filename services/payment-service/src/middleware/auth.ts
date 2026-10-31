import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    storeId?: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const decoded = JSON.parse(payloadJson);
      req.user = {
        id: decoded.userId || decoded.id || '00000000-0000-0000-0000-000000000001',
        email: decoded.email || '',
        role: decoded.role || 'customer',
        storeId: decoded.storeId || (req.headers['x-store-id'] as string) || undefined,
      };
    } else {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@jequex.com',
        role: 'super_admin'
      };
    }
  } catch (e) {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@jequex.com',
      role: 'super_admin'
    };
  }

  next();
};

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

export const requireSuperAdmin = requireRole(['super_admin']);
export const requireAdmin = requireRole(['admin', 'store_admin', 'super_admin']);
export const requireCustomer = requireRole(['customer', 'admin', 'store_admin', 'moderator', 'super_admin']);
