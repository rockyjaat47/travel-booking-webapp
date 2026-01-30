/**
 * ERROR HANDLING MIDDLEWARE
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  public errors: Array<{ field: string; message: string }>;

  constructor(
    message: string = 'Validation failed',
    errors: Array<{ field: string; message: string }> = []
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment failed', code: string = 'PAYMENT_ERROR') {
    super(message, 402, code);
  }
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: string;
    stack?: string;
    validationErrors?: Array<{ field: string; message: string }>;
  };
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let validationErrors: Array<{ field: string; message: string }> | undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;

    if (err instanceof ValidationError) {
      validationErrors = err.errors;
    }
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    const prismaError = err as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'A record with this information already exists.';
        break;
      case 'P2025':
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = 'Record not found.';
        break;
      case 'P2003':
        statusCode = 400;
        errorCode = 'FOREIGN_KEY_CONSTRAINT';
        message = 'Related record does not exist.';
        break;
      default:
        statusCode = 500;
        errorCode = 'DATABASE_ERROR';
        message = 'Database operation failed.';
    }
  } else if (err.name === 'ZodError') {
    // Handle Zod validation errors
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    const zodError = err as any;
    validationErrors = zodError.errors?.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired.';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error:', {
      statusCode,
      errorCode,
      message,
      path: req.path,
      method: req.method,
    });
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  // Add validation errors if present
  if (validationErrors) {
    errorResponse.error.validationErrors = validationErrors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// ============================================================================
// ASYNC HANDLER WRAPPER
// ============================================================================

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};