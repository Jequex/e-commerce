import { Request, Response, NextFunction } from 'express';
import { errors } from '@ecommerce/utils';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Handle different types of errors
  if (error.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: 'Validation failed',
        details: error.details,
      },
    });
  }

  if (error.code === 'DUPLICATE_EMAIL') {
    return res.status(409).json({
      success: false,
      error: {
        code: error.code,
        message: 'Email already exists',
      },
    });
  }

  if (error.code === 'INVALID_CREDENTIALS') {
    return res.status(401).json({
      success: false,
      error: {
        code: error.code,
        message: 'Invalid email or password',
      },
    });
  }

  if (error.code === 'USER_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: error.code,
        message: 'User not found',
      },
    });
  }

  if (error.code === 'INVALID_TOKEN') {
    return res.status(401).json({
      success: false,
      error: {
        code: error.code,
        message: 'Invalid or expired token',
      },
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
    },
  });
};