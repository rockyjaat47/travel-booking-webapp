/**
 * AUTHENTICATION MIDDLEWARE
 * JWT verification and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, TokenPayload } from '../types';
import { UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// JWT VERIFICATION
// ============================================================================

/**
 * Verify JWT token from Authorization header
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        error: {
          code: 'TOKEN_EXPIRED',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
        error: {
          code: 'INVALID_TOKEN',
        },
      });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

/**
 * Check if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        error: {
          code: 'FORBIDDEN',
          details: `Required roles: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Admin authorization middleware
 */
export const authorizeAdmin = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Super admin authorization middleware
 */
export const authorizeSuperAdmin = authorize(UserRole.SUPER_ADMIN);

/**
 * Partner authorization middleware
 */
export const authorizePartner = authorize(
  UserRole.PARTNER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN
);

// ============================================================================
// OPTIONAL AUTHENTICATION
// ============================================================================

/**
 * Optional authentication - attaches user if token valid, doesn't fail if not
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    // Continue without user info
    next();
  }
};