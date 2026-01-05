import { Request, Response, NextFunction } from 'express';

/**
 * Set cache headers for cacheable responses
 * Use for static/reference data that doesn't change frequently
 *
 * @param maxAge - Cache duration in seconds (default: 5 minutes)
 */
export const setCacheHeaders = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Cache-Control: public allows intermediary caches (CDN, proxies) to cache the response
    // max-age specifies how long the response is fresh
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

/**
 * Set no-cache headers for dynamic/user-specific data
 * Use for personalized content, auth-protected data
 */
export const setNoCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent all caching
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache'); // HTTP/1.0 backward compatibility
  res.set('Expires', '0'); // Proxies
  next();
};

/**
 * Conditional cache headers based on authentication
 * Cache for anonymous users, no-cache for authenticated users
 */
export const setConditionalCache = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If user is authenticated (has authorization header), don't cache
    if (req.headers.authorization) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      // Cache for anonymous users
      res.set('Cache-Control', `public, max-age=${maxAge}`);
    }
    next();
  };
};
