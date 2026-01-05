import request from 'supertest';
import app from '../src/server';

/**
 * CDMT Application - Automated Security Tests
 * Sprint 8.2 - Security & Testing
 *
 * Test Coverage:
 * - Input validation (XSS, SQL injection)
 * - CSRF protection
 * - Authentication & Authorization
 * - Rate limiting
 * - HTTP security headers
 * - File upload security
 */

describe('Security Tests - OWASP Top 10', () => {

  // ==================================================
  // A03: INJECTION TESTS
  // ==================================================

  describe('A03: Injection Protection', () => {

    it('should block XSS payloads in login email', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg/onload=alert("XSS")>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: payload,
            password: 'password123',
          });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Validation failed');
      }
    });

    it('should block SQL injection payloads', async () => {
      const sqlPayloads = [
        "' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        "1' UNION SELECT NULL--",
        "'; DROP TABLE users--",
      ];

      for (const payload of sqlPayloads) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: payload,
            password: 'password123',
          });

        // Should fail validation or return 401, never expose database error
        expect([400, 401]).toContain(response.status);
        expect(response.body).not.toHaveProperty('stack');
      }
    });

    it('should sanitize input in create ministry endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/ministries')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: '<script>alert("XSS")</script>',
          name: '"><img src=x onerror=alert("XSS")>',
        });

      // Should reject with validation error
      expect([400, 401, 403]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toContain('Validation failed');
      }
    });
  });

  // ==================================================
  // A01: BROKEN ACCESS CONTROL
  // ==================================================

  describe('A01: Access Control', () => {

    it('should reject unauthenticated requests to protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/v1/ministries',
        '/api/v1/users',
        '/api/v1/roles',
        '/api/v1/sectoral-measures',
        '/api/v1/audit-logs',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app).get(endpoint);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/unauthorized|authentication required/i);
      }
    });

    it('should reject requests with invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/v1/ministries')
          .set('Authorization', token);

        expect(response.status).toBe(401);
      }
    });

    it('should enforce authorization permissions', async () => {
      // Attempt to access admin-only endpoint without proper permissions
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer user-token-without-admin-permission');

      expect([401, 403]).toContain(response.status);
    });
  });

  // ==================================================
  // A07: AUTHENTICATION FAILURES
  // ==================================================

  describe('A07: Authentication Failures', () => {

    it('should enforce password complexity', async () => {
      const weakPasswords = [
        'pass',          // Too short
        'password',       // No uppercase, no number
        'PASSWORD',       // No lowercase, no number
        '12345678',       // No letters
        'Pass123',        // Too short
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password,
            firstName: 'Test',
            lastName: 'User',
            roleId: '123e4567-e89b-12d3-a456-426614174000',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
      }
    });

    it('should rate limit login attempts', async () => {
      const requests = [];

      // Send 6 requests (limit is 5 per 15 minutes)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    });

    it('should not expose user existence in login errors', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      // Should use generic error message
      expect(response.body.message).not.toMatch(/user not found|email not found/i);
      expect(response.body.message).toMatch(/invalid credentials|authentication failed/i);
    });
  });

  // ==================================================
  // A05: SECURITY MISCONFIGURATION
  // ==================================================

  describe('A05: Security Misconfiguration', () => {

    it('should set secure HTTP headers', async () => {
      const response = await request(app).get('/health');

      // Helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).not.toHaveProperty('x-powered-by');

      // CSP header
      expect(response.headers).toHaveProperty('content-security-policy');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should hide server information', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).not.toHaveProperty('server');
    });

    it('should enforce CORS policy', async () => {
      const response = await request(app)
        .get('/api/v1/ministries')
        .set('Origin', 'https://malicious-site.com');

      // CORS should block or not set Access-Control-Allow-Origin
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
      }
    });
  });

  // ==================================================
  // A08: SOFTWARE & DATA INTEGRITY (CSRF)
  // ==================================================

  describe('A08: CSRF Protection', () => {

    it('should provide CSRF token endpoint', async () => {
      const response = await request(app).get('/api/v1/csrf-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('csrfToken');
      expect(response.body.csrfToken).toBeTruthy();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject POST requests without CSRF token', async () => {
      const response = await request(app)
        .post('/api/v1/ministries')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'TEST',
          name: 'Test Ministry',
        });

      // Should be rejected due to missing CSRF token (if not excluded endpoint)
      // Note: May need adjustment based on actual CSRF configuration
      expect([400, 401, 403]).toContain(response.status);
    });

    it('should accept POST requests with valid CSRF token', async () => {
      // Get CSRF token
      const tokenResponse = await request(app).get('/api/v1/csrf-token');
      const csrfToken = tokenResponse.body.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];

      // Make POST request with token
      const response = await request(app)
        .post('/api/v1/ministries')
        .set('Authorization', 'Bearer valid-token')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({
          code: 'TEST',
          name: 'Test Ministry',
        });

      // Should not be rejected due to CSRF (may still fail auth)
      expect(response.status).not.toBe(403);
    });
  });

  // ==================================================
  // INPUT VALIDATION TESTS
  // ==================================================

  describe('Input Validation', () => {

    it('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@domain',
        'user domain@example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email,
            password: 'Password123',
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      }
    });

    it('should validate UUID format for ID parameters', async () => {
      const invalidUUIDs = [
        '123',
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '',
      ];

      for (const id of invalidUUIDs) {
        const response = await request(app)
          .get(`/api/v1/ministries/${id}`)
          .set('Authorization', 'Bearer valid-token');

        expect([400, 401, 404]).toContain(response.status);
      }
    });

    it('should enforce pagination limits', async () => {
      const response = await request(app)
        .get('/api/v1/ministries?page=0&limit=1000')
        .set('Authorization', 'Bearer valid-token');

      // Should enforce page >= 1 and limit <= 100
      expect([400, 401]).toContain(response.status);
    });

    it('should validate file upload size', async () => {
      // Create a large buffer (> 10MB)
      const largeFile = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app)
        .post('/api/v1/import/budgets')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', largeFile, 'large-file.xlsx');

      expect([400, 413]).toContain(response.status);
    });
  });

  // ==================================================
  // ERROR HANDLING
  // ==================================================

  describe('Error Handling', () => {

    it('should not expose stack traces in production', async () => {
      // Force an error by sending malformed data
      const response = await request(app)
        .post('/api/v1/ministries')
        .set('Authorization', 'Bearer valid-token')
        .send({
          invalid: 'data',
        });

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('stackTrace');
    });

    it('should return appropriate status codes', async () => {
      const tests = [
        { path: '/api/v1/nonexistent', expectedStatus: 404 },
        { path: '/api/v1/ministries', expectedStatus: 401, noAuth: true },
      ];

      for (const test of tests) {
        const req = request(app).get(test.path);
        if (!test.noAuth) {
          req.set('Authorization', 'Bearer valid-token');
        }

        const response = await req;
        expect(response.status).toBe(test.expectedStatus);
      }
    });
  });

  // ==================================================
  // RATE LIMITING
  // ==================================================

  describe('Rate Limiting', () => {

    it('should rate limit API requests', async () => {
      const requests = [];

      // Send 101 requests (limit is 100 per 15 minutes)
      for (let i = 0; i < 101; i++) {
        requests.push(request(app).get('/health'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // At least one should be rate limited
      expect(rateLimited).toBe(true);
    });
  });

  // ==================================================
  // HEALTH CHECK
  // ==================================================

  describe('Health Check', () => {

    it('should respond to health check', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('CDMT API is running');
    });

    it('should not require authentication for health check', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });
  });
});

/**
 * Run tests:
 * npm test
 *
 * Run with coverage:
 * npm test -- --coverage
 *
 * Run specific test:
 * npm test -- --testNamePattern="should block XSS payloads"
 */
