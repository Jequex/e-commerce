import { z } from 'zod';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public details?: any;

  constructor(message: string, code: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errors = {
  createError: (message: string, code: string, statusCode: number = 500): AppError => {
    return new AppError(message, code, statusCode);
  },

  formatValidationErrors: (error: z.ZodError) => {
    return error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  },

  // Common error types
  validation: (message: string = 'Validation failed', details?: any) => {
    const error = new AppError(message, 'VALIDATION_ERROR', 400);
    error.details = details;
    return error;
  },

  unauthorized: (message: string = 'Unauthorized') => {
    return new AppError(message, 'UNAUTHORIZED', 401);
  },

  forbidden: (message: string = 'Forbidden') => {
    return new AppError(message, 'FORBIDDEN', 403);
  },

  notFound: (message: string = 'Resource not found') => {
    return new AppError(message, 'NOT_FOUND', 404);
  },

  conflict: (message: string = 'Resource conflict') => {
    return new AppError(message, 'CONFLICT', 409);
  },

  internal: (message: string = 'Internal server error') => {
    return new AppError(message, 'INTERNAL_ERROR', 500);
  },
};