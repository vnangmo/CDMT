import { Request, Response, NextFunction } from 'express';
import { runWithAuditContext } from '../utils/auditContext';

/**
 * Express middleware to populate audit context from request
 *
 * This middleware should be registered AFTER authentication middleware
 * so that req.user is available.
 *
 * It extracts:
 * - User ID from req.user (set by authentication middleware)
 * - IP address from request
 * - User agent from request headers
 *
 * And makes them available throughout the request lifecycle via AsyncLocalStorage
 *
 * @example
 * ```typescript
 * // In app.ts or server.ts:
 * app.use(authenticate); // First authenticate
 * app.use(auditContextMiddleware); // Then setup audit context
 * ```
 */
export function auditContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract user ID from authenticated request
  // @ts-ignore - req.user is added by authentication middleware
  const userId = req.user?.id;

  // If no user ID, this is either a public endpoint or authentication failed
  // In such cases, we don't set up audit context
  if (!userId) {
    next();
    return;
  }

  // Extract IP address
  // Check for X-Forwarded-For header (when behind proxy/load balancer)
  // Fall back to socket remote address
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown';

  // Extract user agent
  const userAgent = req.get('user-agent') || 'unknown';

  // Set up audit context for this request and all async operations it spawns
  const auditContext = {
    userId,
    ipAddress,
    userAgent,
  };

  // Run the rest of the request handling within this audit context
  runWithAuditContext(auditContext, () => {
    next();
  });
}

/**
 * Optional middleware to log when audit context is missing
 * Useful for debugging
 */
export function requireAuditContext(req: Request, res: Response, next: NextFunction): void {
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    console.warn('[AuditContext] Request without user context:', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
  }

  next();
}
