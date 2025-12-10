import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  users, 
  userSessions, 
  passwordResets, 
  emailVerifications, 
  userActivities,
  insertUserSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../schema/auth';
import { eq, and, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  private emailServiceUrl: string;

  constructor() {
    // Use docker service name for inter-service communication
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://email-service:3005';
  }

  // Register new user
  async register(req: Request, res: Response) {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email)
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const [newUser] = await db.insert(users).values({
        id: uuidv4(),
        email: validatedData.email,
        passwordHash: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role || 'customer',
        phone: validatedData.phone || null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt
      });

      // Create email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(emailVerifications).values({
        email: newUser.email,
        userId: newUser.id,
        token: verificationToken,
        expiresAt: verificationExpiry
      });

      // Log activity
      await this.logUserActivity(newUser.id, 'user_registered', req);

      // TODO: Send verification email
      await this.sendWelcomeEmail(newUser.email, newUser.firstName, verificationToken);

      res.status(201).json({
        message: 'User registered successfully',
        user: newUser,
        verificationRequired: true
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // User login
  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email)
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'Account is not active',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);

      if (!isValidPassword) {
        await this.logUserActivity(user.id, 'login_failed', req);
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '24h' }
      );

      // Create session
      const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const [session] = await db.insert(userSessions).values({
        id: uuidv4(),
        userId: user.id,
        token,
        expiresAt: sessionExpiry,
        isActive: true,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || 'Unknown',
        createdAt: new Date(),
        lastUsedAt: new Date()
      }).returning();

      // Log activity
      await this.logUserActivity(user.id, 'user_login', req);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // User logout
  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.session) {
        return res.status(401).json({
          error: 'No active session',
          code: 'NO_SESSION'
        });
      }

      // Mark session as inactive
      await db
        .update(userSessions)
        .set({ 
          isActive: false
        })
        .where(eq(userSessions.id, req.session.id));

      // Log activity
      if (req.user) {
        await this.logUserActivity(req.user.id, 'user_logout', req);
      }

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get current user profile
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: {
          passwordHash: false // Exclude password hash
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Request password reset
  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          code: 'EMAIL_REQUIRED'
        });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await db.insert(passwordResets).values({
        id: uuidv4(),
        userId: user.id,
        token: resetToken,
        expiresAt: resetExpiry,
        createdAt: new Date()
      });

      // Log activity
      await this.logUserActivity(user.id, 'password_reset_requested', req);

      // Send reset email
      await this.sendPasswordResetEmail(user.email, resetToken);

      res.json({
        message: 'If the email exists, a password reset link has been sent'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Reset password with token
  async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);

      // Find valid reset token
      const resetRecord = await db.query.passwordResets.findFirst({
        where: and(
          eq(passwordResets.token, validatedData.token),
          eq(passwordResets.used, false)
        )
      });

      if (!resetRecord) {
        return res.status(400).json({
          error: 'Invalid or expired reset token',
          code: 'INVALID_TOKEN'
        });
      }

      // Check if token is expired
      if (new Date() > resetRecord.expiresAt) {
        return res.status(400).json({
          error: 'Reset token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Update user password
      await db
        .update(users)
        .set({ 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, resetRecord.userId));

      // Mark reset token as used
      await db
        .update(passwordResets)
        .set({ 
          used: true
        })
        .where(eq(passwordResets.id, resetRecord.id));

      // Invalidate all user sessions
      await db
        .update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.userId, resetRecord.userId));

      // Log activity
      await this.logUserActivity(resetRecord.userId, 'password_reset_completed', req);

      res.json({
        message: 'Password reset successful'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Change password (authenticated)
  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const validatedData = changePasswordSchema.parse(req.body);

      // Get current user
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id)
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isValidCurrentPassword = await bcrypt.compare(
        validatedData.currentPassword,
        user.passwordHash
      );

      if (!isValidCurrentPassword) {
        return res.status(400).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

      // Update password
      await db
        .update(users)
        .set({ 
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      // Log activity
      await this.logUserActivity(user.id, 'password_changed', req);

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get user sessions
  async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const sessions = await db
        .select({
          id: userSessions.id,
          userAgent: userSessions.userAgent,
          ipAddress: userSessions.ipAddress,
          isActive: userSessions.isActive,
          createdAt: userSessions.createdAt,
          lastUsedAt: userSessions.lastUsedAt,
          expiresAt: userSessions.expiresAt
        })
        .from(userSessions)
        .where(eq(userSessions.userId, req.user.id))
        .orderBy(desc(userSessions.lastUsedAt));

      res.json({
        sessions
      });

    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Revoke session
  async revokeSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { sessionId } = req.params;

      // Update session
      const result = await db
        .update(userSessions)
        .set({ 
          isActive: false
        })
        .where(
          and(
            eq(userSessions.id, sessionId),
            eq(userSessions.userId, req.user.id)
          )
        );

      res.json({
        message: 'Session revoked successfully'
      });

    } catch (error) {
      console.error('Revoke session error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Verification token is required',
          code: 'TOKEN_REQUIRED'
        });
      }

      const record = await db.query.emailVerifications.findFirst({
        where: eq(emailVerifications.token, token)
      });

      if (!record) {
        return res.status(400).json({
          error: 'Invalid verification token',
          code: 'INVALID_TOKEN'
        });
      }

      if (new Date() > record.expiresAt) {
        return res.status(400).json({
          error: 'Verification token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Update user emailVerified status
      await db
        .update(users)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, record.userId));

      await db
        .update(emailVerifications)
        .set({ verified: true, updatedAt: new Date() })
        .where(eq(emailVerifications.token, token));
      // Log activity
      await this.logUserActivity(record.userId, 'email_verified', req);

      res.json({
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Send welcome email
  private async sendWelcomeEmail(email: string, name: string, token: string) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      const emailPayload = {
        to: [{ email, name }],
        subject: 'Welcome to Jequex Stores!',
        template: 'welcome',
        templateData: {
          verificationUrl,
          companyName: 'Jequex Stores',
          subject: 'We are excited to have you onboard!',
          firstName: name,
          currentYear: new Date().getFullYear()
        }
      };

      await axios.post(`${this.emailServiceUrl}/api/v1/email/send`, emailPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      console.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw the error to prevent blocking user registration
      // Log the error for monitoring purposes
    }
  }

  // Send verification email
  private async sendVerificationEmail(email: string, name: string, token: string) {
    try {
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      
      const emailPayload = {
        to: [{ email, name }],
        subject: 'Verify Your Email Address - Jequex E-commerce',
        template: 'verification',
        templateData: {
          verificationLink,
          token,
          companyName: 'Jequex E-commerce'
        }
      };

      await axios.post(`${this.emailServiceUrl}/api/v1/email/send`, emailPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      console.log(`Verification email sent to: ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw the error to prevent blocking user registration
      // Log the error for monitoring purposes
    }
  }

  // Send password reset email
  private async sendPasswordResetEmail(email: string, token: string) {
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      const emailPayload = {
        to: [{ email, name: '' }],
        subject: 'Password Reset Request - Jequex E-commerce',
        template: 'password-reset',
        templateData: {
          resetLink,
          token,
          companyName: 'Jequex E-commerce'
        }
      };

      await axios.post(`${this.emailServiceUrl}/api/v1/email/send`, emailPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw the error to prevent blocking the password reset flow
      // Log the error for monitoring purposes
    }
  }

  // Resend verification email
  async resendVerificationEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          code: 'EMAIL_REQUIRED'
        });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({
          error: 'Email is already verified',
          code: 'EMAIL_ALREADY_VERIFIED'
        });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(emailVerifications).values({
        email: user.email,
        userId: user.id,
        token: verificationToken,
        expiresAt: verificationExpiry
      });
      await this.sendVerificationEmail(user.email, user.firstName, verificationToken);
      // Log activity
      await this.logUserActivity(user.id, 'verification_email_resent', req);

      res.json({
        message: 'Verification email resent successfully'
      });

    } catch (error) {
      console.error('Resend verification email error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token is required',
          code: 'TOKEN_REQUIRED'
        });
      }

      // Find session by refresh token
      const session = await db.query.userSessions.findFirst({
        where: eq(userSessions.refreshToken, refreshToken)
      });

      if (!session || !session.isActive) {
        return res.status(401).json({
          error: 'Invalid or inactive refresh token',
          code: 'INVALID_TOKEN'
        });
      }

      // Generate new JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const newToken = jwt.sign(
        { userId: session.userId },
        jwtSecret,
        { expiresIn: '24h' }
      );

      // Update session with new token
      await db
        .update(userSessions)
        .set({ 
          token: newToken,
          lastUsedAt: new Date()
        })
        .where(eq(userSessions.id, session.id));

      res.json({
        message: 'Token refreshed successfully',
        token: newToken
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Admin registration
  async adminRegister(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role = 'admin', permissions } = req.body;

      // Check if admin user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Admin user with this email already exists',
          code: 'ADMIN_EXISTS'
        });
      }

      // Hash password with higher rounds for admin accounts
      const hashedPassword = await bcrypt.hash(password, 14);

      // Create admin user
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: role as 'admin' | 'super_admin',
        emailVerified: true, // Admin accounts are pre-verified
        status: 'active',
        metadata: { permissions: permissions || [] }, // Store permissions in metadata
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Log admin creation activity
      await this.logUserActivity(newUser.id, 'ADMIN_REGISTER', req);

      res.status(201).json({
        message: 'Admin user created successfully',
        admin: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          permissions: (newUser.metadata as any)?.permissions || []
        }
      });

    } catch (error) {
      console.error('Admin registration error:', error);
      res.status(500).json({
        error: 'Failed to create admin user',
        code: 'ADMIN_REGISTRATION_FAILED'
      });
    }
  }

  // Admin login
  async adminLogin(req: Request, res: Response) {
    try {
      const { email, password, adminCode } = req.body;

      // Find admin user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user || !['admin', 'super_admin'].includes(user.role || '')) {
        return res.status(401).json({
          error: 'Invalid admin credentials',
          code: 'INVALID_ADMIN_CREDENTIALS'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await this.logUserActivity(user.id, 'ADMIN_LOGIN_FAILED', req);
        return res.status(401).json({
          error: 'Invalid admin credentials',
          code: 'INVALID_ADMIN_CREDENTIALS'
        });
      }

      // Check if account is active
      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'Admin account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Optional: Verify admin code if provided (for additional security)
      if (adminCode && process.env.ADMIN_VERIFICATION_CODE) {
        if (adminCode !== process.env.ADMIN_VERIFICATION_CODE) {
          await this.logUserActivity(user.id, 'ADMIN_LOGIN_INVALID_CODE', req);
          return res.status(401).json({
            error: 'Invalid admin verification code',
            code: 'INVALID_ADMIN_CODE'
          });
        }
      }

      // Generate JWT token with admin claims
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role,
          permissions: (user.metadata as any)?.permissions || [],
          isAdmin: true
        },
        jwtSecret,
        { expiresIn: '8h' } // Shorter expiry for admin sessions
      );

      // Create session
      const sessionId = uuidv4();
      await db.insert(userSessions).values({
        id: sessionId,
        userId: user.id,
        token: token,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        createdAt: new Date(),
        lastUsedAt: new Date()
      });

      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id));

      // Log successful admin login
      await this.logUserActivity(user.id, 'ADMIN_LOGIN_SUCCESS', req);

      res.json({
        message: 'Admin login successful',
        token,
        sessionId,
        admin: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: (user.metadata as any)?.permissions || [],
          lastLoginAt: user.lastLoginAt
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        error: 'Admin login failed',
        code: 'ADMIN_LOGIN_ERROR'
      });
    }
  }

  // Helper method to log user activities
  private async logUserActivity(
    userId: string, 
    activityType: string, 
    req: Request | AuthenticatedRequest,
    metadata?: any
  ) {
    try {
      await db.insert(userActivities).values({
        userId,
        action: activityType,
        ipAddress: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't throw error as this is not critical
    }
  }
}