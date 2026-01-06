import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { config } from '../config/config';

/**
 * CSRF Protection Middleware using double-submit cookie pattern
 *
 * How it works:
 * 1. Server generates a CSRF token and sends it in both:
 *    - A cookie (httpOnly, secure, sameSite)
 *    - Response body/header for client to use
 * 2. Client must include the token from the response in subsequent state-changing requests
 * 3. Server validates that the token in the request matches the token in the cookie
 *
 * This prevents CSRF attacks because:
 * - Attackers cannot read cookies from another domain (Same-Origin Policy)
 * - Without the token, they cannot forge valid state-changing requests
 */

const csrfUtils = doubleCsrf({
  getSecret: () => config.jwt.secret, // Use JWT secret as CSRF secret
  getSessionIdentifier: (req: Request) => req.ip || 'anonymous', // Required in new version
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true, // Prevents JavaScript access to the cookie
    secure: config.env === 'production', // Only HTTPS in production
    sameSite: 'strict', // Prevents cross-site cookie sending
    path: '/',
    maxAge: 3600000, // 1 hour
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods that don't need CSRF protection
});

// Extract utilities - use type assertion for compatibility
const generateToken = (csrfUtils as any).generateToken || csrfUtils.generateCsrfToken;
const doubleCsrfProtection = csrfUtils.doubleCsrfProtection;

/**
 * Middleware to add CSRF token to response
 * Use this on routes that render forms or provide token endpoints
 */
export const csrfProtection = doubleCsrfProtection;

/**
 * Endpoint to get a new CSRF token
 * Frontend should call this before making state-changing requests
 */
export const getCsrfToken = (req: Request, res: Response) => {
  const token = generateToken(req, res);
  res.json({
    status: 'success',
    csrfToken: token,
  });
};

/**
 * Error handler for CSRF validation failures
 */
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('CSRF')) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid CSRF token. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED',
    });
  }
  return next(err);
};

/**
 * Conditionally apply CSRF protection
 * Skip for API authentication endpoints and GET requests
 */
export const conditionalCsrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for:
  // 1. Authentication endpoints (login uses other protections like rate limiting)
  // 2. Public read-only endpoints
  // 3. Preflight OPTIONS requests

  const skipPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/refresh',
    '/api/v1/health',
    '/api/v1/', // Skip CSRF for all API routes during development
  ];

  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Apply CSRF protection for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }

  next();
};
