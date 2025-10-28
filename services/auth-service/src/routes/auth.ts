import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validate-request';

// Define schemas locally since @ecommerce/utils is not available
const schemas = {
  email: z.string().email(),
  password: z.string().min(8).max(100),
};

const router = Router();
const authController = new AuthController();

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
  authController.register.bind(authController)
);

// Login
router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login.bind(authController)
);

// Logout
router.post('/logout', authController.logout.bind(authController));

// Refresh token
router.post('/refresh', authController.refreshToken.bind(authController));

// Forgot password
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  authController.requestPasswordReset.bind(authController)
);

// Reset password
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

// Verify email
router.post(
  '/verify-email',
  validateRequest(verifyEmailSchema),
  authController.verifyEmail.bind(authController)
);

// Resend verification email
router.post('/resend-verification', authController.resendVerificationEmail.bind(authController));

export { router as authRoutes };