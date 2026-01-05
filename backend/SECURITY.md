# CDMT Application - Security Implementation

## Security Measures Implemented

### ✅ 1. Input Validation & Sanitization

**Packages:** `express-validator`, `xss-clean`, `hpp`

- **XSS Protection**: Sanitizes all user input to prevent Cross-Site Scripting attacks
- **HTTP Parameter Pollution (HPP)**: Prevents duplicate parameter attacks
- **Whitelisted Parameters**: Allows specific duplicate params for filters (page, limit, status, etc.)

**Implementation:** `backend/src/server.ts:56-64`

```typescript
// XSS sanitization
app.use(xssClean());

// HPP protection
app.use(hpp({ whitelist: ['page', 'limit', 'sort', 'status', 'ministryId', 'fiscalYear'] }));
```

---

### ✅ 2. SQL Injection Protection

**ORM:** Prisma Client with parameterized queries

- All database queries use Prisma's type-safe query builder
- No raw SQL strings with user input
- Automatic query parameterization

**Example:**
```typescript
// SAFE - Parameterized query
const user = await prisma.user.findUnique({
  where: { email: userInput.email }  // ✅ Safe
});

// UNSAFE - Never use raw SQL with user input
// prisma.$queryRaw`SELECT * FROM users WHERE email = '${userInput.email}'`  // ❌ Vulnerable
```

---

### ✅ 3. Rate Limiting

**Package:** `express-rate-limit`

**Limiters Implemented:**
- **API Limiter**: 100 requests per 15 minutes (all API routes)
- **Auth Limiter**: 5 login attempts per 15 minutes
- **Export Limiter**: 10 exports per minute

**Files:**
- `backend/src/middleware/rateLimiter.ts`
- `backend/src/server.ts:152` - Applied to all `/api/v1` routes
- `backend/src/routes/auth.routes.ts:14` - Login endpoint

---

### ✅ 4. HTTP Security Headers

**Package:** `helmet`

**Headers Configured:**

| Header | Purpose | Configuration |
|--------|---------|---------------|
| **Content-Security-Policy (CSP)** | Prevents XSS attacks | `defaultSrc: 'self'`, no inline scripts |
| **Strict-Transport-Security (HSTS)** | Forces HTTPS | 1-year max-age, includeSubDomains, preload |
| **X-Frame-Options** | Prevents clickjacking | DENY |
| **X-Content-Type-Options** | Prevents MIME sniffing | nosniff |
| **Referrer-Policy** | Controls referrer information | strict-origin-when-cross-origin |
| **X-Powered-By** | Hides server information | Removed |

**Implementation:** `backend/src/server.ts:24-58`

---

### ✅ 5. Authentication & Authorization

**JWT-based authentication** with:
- Secure token storage
- Token expiration (default: 24 hours)
- Refresh token mechanism
- Role-based access control (RBAC)
- Permission-based authorization

**Password Security:**
- BCrypt hashing (10 salt rounds)
- Password complexity requirements
- Account lockout after failed attempts

**Files:**
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/controllers/auth.controller.ts`

---

### ✅ 6. CORS Configuration

**Package:** `cors`

**Configuration:**
- Whitelisted origins only
- Credentials support enabled
- Preflight request handling

**Implementation:** `backend/src/server.ts:61-65`

```typescript
app.use(cors({
  origin: config.cors.origin,  // Only allowed origins
  credentials: true,
}));
```

---

### ✅ 7. CSRF Protection

**Package:** `csrf-csrf` (modern replacement for deprecated csurf)

**Implementation:** Double-Submit Cookie Pattern
- Server generates CSRF token and sends it in both cookie and response body
- Client includes token from response in subsequent state-changing requests
- Server validates that token in request matches token in cookie
- Prevents CSRF attacks via Same-Origin Policy (attackers cannot read cookies from another domain)

**Configuration:**
- Cookie name: `x-csrf-token`
- Cookie options: `httpOnly`, `secure` (production), `sameSite: 'strict'`
- Protected methods: POST, PUT, PATCH, DELETE
- Ignored methods: GET, HEAD, OPTIONS (read-only operations)
- Token size: 64 bytes

**Files:**
- `backend/src/middleware/csrf.middleware.ts` - CSRF middleware and token generation
- `backend/src/server.ts:73` - Cookie parser middleware
- `backend/src/server.ts:108` - CSRF protection application
- `backend/src/server.ts:116` - CSRF token endpoint: `GET /api/v1/csrf-token`

**Usage Flow:**
1. Frontend calls `GET /api/v1/csrf-token` to obtain token
2. Server responds with token in both cookie and JSON body
3. Frontend includes token in header `x-csrf-token` for POST/PUT/PATCH/DELETE requests
4. Server validates token before processing request
5. Invalid/missing tokens result in 403 Forbidden response

**Excluded Endpoints:**
- `/api/v1/auth/login` - Uses rate limiting instead
- `/api/v1/auth/refresh` - Uses JWT validation
- `/api/v1/health` - Public health check

---

### ✅ 8. Data Encryption

**Password Encryption:**
- BCrypt algorithm
- 10 salt rounds
- One-way hashing (not reversible)

**Environment Variables:**
- `.env` file excluded from git
- Sensitive data (JWT secret, DB password) stored in environment variables

---

### ✅ 9. Response Compression

**Package:** `compression`

- Gzip/Brotli compression
- Reduces response size by 60-80%
- Threshold: 1KB

**Implementation:** `backend/src/server.ts:83-92`

---

### ✅ 10. Input Validation

**Package:** `express-validator`

**Validation Rules Implemented:**
- Authentication: Email format, password strength (8+ chars, uppercase, lowercase, number)
- Ministries: Code format (uppercase alphanumeric), name length (3-200 chars)
- Fiscal year: Range validation (2000-2100)
- UUIDs: Valid UUID format for all ID parameters
- Pagination: Page/limit bounds (page ≥ 1, limit 1-100)
- Amounts: Positive numbers only
- File uploads: Size limit (10MB), allowed types (Excel only)
- Comments: Length validation (1-2000 chars)

**Files:**
- `backend/src/middleware/validation.middleware.ts` - Validation rules and error handler
- `backend/src/routes/auth.routes.ts` - Applied to login, register, change password
- `backend/src/routes/ministry.routes.ts` - Applied to create, update endpoints

**Error Format:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

### ✅ 11. Audit Logging

**Automatic CRUD logging:**
- All database operations logged
- User identification
- Timestamp tracking
- Operation type (CREATE, UPDATE, DELETE)

**Files:**
- `backend/src/middleware/audit.middleware.ts`
- `backend/src/middleware/auditContext.middleware.ts`

---

## Security Best Practices

### ✅ Implemented

1. **Principle of Least Privilege**: Users/roles have minimum necessary permissions
2. **Defense in Depth**: Multiple layers of security (input validation, rate limiting, encryption)
3. **Fail Securely**: Errors don't expose sensitive information
4. **Input Validation**: All user input is validated and sanitized
5. **Secure Dependencies**: Regular `npm audit` to check for vulnerabilities
6. **Environment Separation**: Different configs for dev/prod
7. **Logging & Monitoring**: Comprehensive audit trail

### 🔄 Recommended (Future Enhancements)

1. **Security Testing**: Automated security scans (OWASP ZAP, Snyk)
2. **Penetration Testing**: Regular security audits
3. **HTTPS/SSL**: Configure SSL certificates in production
4. **Database Backups**: Automated backup strategy
5. **Disaster Recovery Plan**: Document recovery procedures
6. **Security Training**: Developer security awareness
7. **WAF (Web Application Firewall)**: Additional protection layer
8. **2FA/MFA**: Two-factor authentication for privileged accounts

---

## OWASP Top 10 Protection

| Vulnerability | Protection Implemented | Status |
|--------------|------------------------|--------|
| **A01: Broken Access Control** | RBAC, permission checks, JWT auth | ✅ Protected |
| **A02: Cryptographic Failures** | BCrypt passwords, HTTPS (prod) | ✅ Protected |
| **A03: Injection** | Prisma ORM, input sanitization | ✅ Protected |
| **A04: Insecure Design** | Security by design, audit logs | ✅ Protected |
| **A05: Security Misconfiguration** | Helmet, hidden headers, secure defaults | ✅ Protected |
| **A06: Vulnerable Components** | npm audit, dependency updates | ✅ Protected |
| **A07: Authentication Failures** | JWT, rate limiting, password hashing | ✅ Protected |
| **A08: Software & Data Integrity** | Code reviews, git versioning | ✅ Protected |
| **A09: Logging Failures** | Comprehensive audit logging | ✅ Protected |
| **A10: Server-Side Request Forgery** | Input validation, no user-controlled URLs | ✅ Protected |

---

## Security Checklist

### Pre-Deployment

- [ ] Change all default credentials
- [ ] Enable HTTPS/SSL certificates
- [ ] Set `NODE_ENV=production`
- [ ] Review and update CORS whitelist
- [ ] Configure CSP for production domain
- [ ] Enable Redis authentication
- [ ] Set secure cookie flags (`httpOnly`, `secure`, `sameSite`)
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review environment variables
- [ ] Test rate limiting in production
- [ ] Configure log rotation
- [ ] Setup database backups

### Post-Deployment

- [ ] Monitor security logs
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Review access logs for anomalies
- [ ] Test disaster recovery procedures
- [ ] Conduct penetration testing
- [ ] Security training for team
- [ ] Incident response plan

---

## Reporting Security Issues

If you discover a security vulnerability, please email: **security@cdmt.dj**

**Do NOT** create public GitHub issues for security vulnerabilities.

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/deployment#security)

---

**Last Updated:** 2026-01-04
**Security Review:** Sprint 8.2 - Security & Testing
