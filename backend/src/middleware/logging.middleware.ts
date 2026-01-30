/**
 * REQUEST LOGGING MIDDLEWARE
 * Logs incoming requests with relevant details
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Log incoming requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log request start
  logger.info(`→ ${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error(`✗ ${req.method} ${req.path} ${res.statusCode}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`⚠ ${req.method} ${req.path} ${res.statusCode}`, logData);
    } else {
      logger.info(`✓ ${req.method} ${req.path} ${res.statusCode}`, logData);
    }
  });

  next();
};

/**
 * Log API requests with body (for debugging)
 * Use only in development
 */
export const debugRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Request body:', {
      method: req.method,
      path: req.path,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }
  next();
};