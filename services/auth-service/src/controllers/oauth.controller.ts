import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { users, oauthProviders, userSessions } from '../schema/auth';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Initiate Google OAuth
 */
export const googleAuthInit = async (req: Request, res: Response) => {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!googleClientId) {
      console.error('Google OAuth error: GOOGLE_CLIENT_ID not configured');
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const redirectUri = `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/google/callback`;
    const scope = 'openid email profile';
    const state = uuidv4(); // Use for CSRF protection

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

    console.log('Google OAuth init:', { redirectUri, clientId: googleClientId.substring(0, 20) + '...' });
    res.json({ authUrl, state });
  } catch (error) {
    console.error('Google auth init error:', error);
    res.status(500).json({ error: 'Failed to initialize Google authentication' });
  }
};

/**
 * Handle Google OAuth callback
 */
export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    console.log('Google OAuth callback received:', { hasCode: !!code });

    if (!code) {
      return res.redirect(`${FRONTEND_URL}?auth=error&message=No authorization code`);
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/google/callback`;

    console.log('Exchanging code for tokens with Google...');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: googleClientId!,
        client_secret: googleClientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('Failed to get access token from Google:', tokens);
      return res.redirect(`${FRONTEND_URL}?auth=error&message=Failed to get access token`);
    }

    console.log('Got access token from Google, fetching user info...');

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    console.log('Google user info:', { email: googleUser.email, id: googleUser.id });

    // Check if user exists with this OAuth provider
    const [existingOAuth] = await db
      .select()
      .from(oauthProviders)
      .where(and(
        eq(oauthProviders.provider, 'google'),
        eq(oauthProviders.providerId, googleUser.id)
      ));

    let userId: string;

    if (existingOAuth) {
      // User exists, update tokens
      userId = existingOAuth.userId;
      await db
        .update(oauthProviders)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          providerData: googleUser,
          updatedAt: new Date(),
        })
        .where(eq(oauthProviders.id, existingOAuth.id));
    } else {
      // Check if user exists with this email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email));

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            username: googleUser.email.split('@')[0],
            passwordHash: '', // No password for OAuth users
            firstName: googleUser.given_name || '',
            lastName: googleUser.family_name || '',
            avatar: googleUser.picture,
            emailVerified: googleUser.verified_email || false,
            role: 'customer',
            status: 'active',
          })
          .returning();

        userId = newUser.id;
      }

      // Create OAuth provider entry
      await db.insert(oauthProviders).values({
        userId,
        provider: 'google',
        providerId: googleUser.id,
        providerData: googleUser,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      });
    }

    // Get full user details
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    await db.insert(userSessions).values({
      userId: user.id,
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Update last login
    await db.update(users).set({
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
    }).where(eq(users.id, user.id));

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}?auth=success&token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${FRONTEND_URL}?auth=error&message=Authentication failed`);
  }
};

/**
 * Initiate Facebook OAuth
 */
export const facebookAuthInit = async (req: Request, res: Response) => {
  try {
    const facebookAppId = process.env.FACEBOOK_APP_ID;
    
    if (!facebookAppId) {
      return res.status(500).json({ error: 'Facebook OAuth not configured' });
    }

    const redirectUri = `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/facebook/callback`;
    const scope = 'email,public_profile';
    const state = uuidv4();

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

    res.json({ authUrl, state });
  } catch (error) {
    console.error('Facebook auth init error:', error);
    res.status(500).json({ error: 'Failed to initialize Facebook authentication' });
  }
};

/**
 * Handle Facebook OAuth callback
 */
export const facebookAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${FRONTEND_URL}?auth=error&message=No authorization code`);
    }

    const facebookAppId = process.env.FACEBOOK_APP_ID;
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/facebook/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${facebookAppId}&client_secret=${facebookAppSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return res.redirect(`${FRONTEND_URL}?auth=error&message=Failed to get access token`);
    }

    // Get user info from Facebook
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${tokens.access_token}`
    );

    const facebookUser = await userInfoResponse.json();

    if (!facebookUser.email) {
      return res.redirect(`${FRONTEND_URL}?auth=error&message=Email permission required`);
    }

    // Check if user exists with this OAuth provider
    const [existingOAuth] = await db
      .select()
      .from(oauthProviders)
      .where(and(
        eq(oauthProviders.provider, 'facebook'),
        eq(oauthProviders.providerId, facebookUser.id)
      ));

    let userId: string;

    if (existingOAuth) {
      userId = existingOAuth.userId;
      await db
        .update(oauthProviders)
        .set({
          accessToken: tokens.access_token,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          providerData: facebookUser,
          updatedAt: new Date(),
        })
        .where(eq(oauthProviders.id, existingOAuth.id));
    } else {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, facebookUser.email));

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: facebookUser.email,
            username: facebookUser.email.split('@')[0],
            passwordHash: '',
            firstName: facebookUser.first_name || '',
            lastName: facebookUser.last_name || '',
            avatar: facebookUser.picture?.data?.url,
            emailVerified: true,
            role: 'customer',
            status: 'active',
          })
          .returning();

        userId = newUser.id;
      }

      await db.insert(oauthProviders).values({
        userId,
        provider: 'facebook',
        providerId: facebookUser.id,
        providerData: facebookUser,
        accessToken: tokens.access_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await db.insert(userSessions).values({
      userId: user.id,
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await db.update(users).set({
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
    }).where(eq(users.id, user.id));

    res.redirect(`${FRONTEND_URL}?auth=success&token=${token}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${FRONTEND_URL}?auth=error&message=Authentication failed`);
  }
};
