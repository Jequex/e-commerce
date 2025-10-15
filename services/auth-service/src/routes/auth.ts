import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth, id, schemas, errors } from '@ecommerce/utils';
import { User, UserRole } from '@ecommerce/types';
import { AuthService } from '../services/auth-service';
import { validateRequest } from '../middleware/validate-request';

const router = Router();
const authService = new AuthService();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: schemas.email,
    password: schemas.password,
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: schemas.email,
    password: z.string().min(1),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: schemas.email,
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    password: schemas.password,
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string(),
  }),
});

// Register
router.post(
  '/register',
  validateRequest(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful. Please check your email for verification.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post(
  '/login',
  validateRequest(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.body.refreshToken;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw errors.createError('Refresh token is required', 'MISSING_REFRESH_TOKEN', 400);
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      
      await authService.forgotPassword(email);

      res.json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Reset password
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;
      
      await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify email
router.post(
  '/verify-email',
  validateRequest(verifyEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      
      await authService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Resend verification email
router.post('/resend-verification', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw errors.createError('Email is required', 'MISSING_EMAIL', 400);
    }

    await authService.resendVerificationEmail(email);

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };