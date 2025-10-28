import { Request, Response, NextFunction } from 'express';
import { ZodSchema, z } from 'zod';
import { errors } from '../utils/errors';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = errors.formatValidationErrors(error);
        const validationError = errors.createError(
          'Validation failed',
          'VALIDATION_ERROR',
          400
        );
        (validationError as any).details = validationErrors;
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};