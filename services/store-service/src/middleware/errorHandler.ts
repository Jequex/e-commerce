import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Custom API errors
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code || 'API_ERROR'
    });
  }

  // Database errors
  if (error.message.includes('duplicate key value')) {
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE'
    });
  }

  if (error.message.includes('violates foreign key constraint')) {
    return res.status(400).json({
      error: 'Invalid reference',
      code: 'INVALID_REFERENCE'
    });
  }

  if (error.message.includes('violates not-null constraint')) {
    return res.status(400).json({
      error: 'Required field missing',
      code: 'REQUIRED_FIELD_MISSING'
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.message,
      stack: error.stack 
    })
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};