import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'janwari-industries-dev-secret-2026' : '');
const JWT_EXPIRES_IN = '8h';

function isDatabaseError(error: unknown) {
  const message = String((error as any)?.message || '').toLowerCase();
  return (
    message.includes('database') ||
    message.includes('connect') ||
    message.includes('connection') ||
    message.includes('neon') ||
    message.includes('socket') ||
    message.includes('prisma')
  );
}

// ─── Validation Schemas ─────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ─── POST /auth/login ───────────────────────────────

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        error: 'Server security configuration is incomplete.',
        code: 'JWT_SECRET_MISSING',
      });
      return;
    }

    const { username, password } = req.body;
    const normalizedUsername = username.trim().toLowerCase();

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account is deactivated. Contact the administrator.',
        code: 'ACCOUNT_DISABLED',
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Generate JWT
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    if (isDatabaseError(error)) {
      res.status(503).json({
        success: false,
        error: 'Cloud database is unavailable. Please check internet or server configuration.',
        code: 'DATABASE_UNAVAILABLE',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'An error occurred during login',
    });
  }
});

// ─── GET /auth/me ───────────────────────────────────
// Returns the current authenticated user's info

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    if (isDatabaseError(error)) {
      res.status(503).json({
        success: false,
        error: 'Cloud database is unavailable. Please try again shortly.',
        code: 'DATABASE_UNAVAILABLE',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
    });
  }
});

export default router;
