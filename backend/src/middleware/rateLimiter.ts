import rateLimit from 'express-rate-limit';
import { config } from '../config/config';

/**
 * General API rate limiter
 * Limits all API routes to prevent abuse
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit?.maxRequests || 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Authentication rate limiter
 * Stricter limits for login/auth endpoints to prevent brute force
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Export rate limiter
 * Limits export operations to prevent resource exhaustion
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 exports per minute
  message: 'Too many export requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
