import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT payload type (mirrors shared/types)
interface JWTPayload {
  userId: string;
  username: string;
  role: 'ADMIN' | 'CASHIER';
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'janwari-industries-dev-secret-2026' : '');

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token and attaches user to request
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    res.status(500).json({
      success: false,
      error: 'Server security configuration is incomplete.',
      code: 'JWT_SECRET_MISSING',
    });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please log in again.',
      code: 'TOKEN_INVALID',
    });
  }
}

/**
 * Role-based access control middleware
 * Must be used AFTER authMiddleware
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource.',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
