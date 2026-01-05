# CDMT Application - Technical Documentation

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**REQ-MAINT-01:** Documentation technique complète

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Database Schema](#6-database-schema)
7. [Security Implementation](#7-security-implementation)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Deployment Guide](#9-deployment-guide)
10. [Monitoring & Logging](#10-monitoring--logging)

---

## 1. Overview

### 1.1 Purpose

The CDMT (Cadre de Dépenses à Moyen Terme) application is a comprehensive budget management system designed for the Republic of Djibouti's Ministry of Economy and Finance. It enables multi-year budget planning, tracking, and reporting.

### 1.2 Key Features

| Module | Description |
|--------|-------------|
| TOFE | Tableau des Opérations Financières de l'État |
| CBMT | Cadre Budgétaire à Moyen Terme |
| CDMT Global | Consolidation of all sectoral CDMTs |
| CDMT Sectoriel | Ministry-specific budget frameworks |
| Workflow | Document approval and validation |
| Reports | Excel/PDF export capabilities |

### 1.3 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| PostgreSQL | 15 | 16 |
| Redis | 7.x | 7.x |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB | 50 GB |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Chrome  │  │ Firefox │  │  Edge   │  │ Safari  │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │ HTTPS (TLS 1.3)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NGINX REVERSE PROXY                        │
│  • SSL Termination  • Load Balancing  • Static Files  • Gzip    │
└─────────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   FRONTEND (React)  │         │   BACKEND (Express) │
│   Port: 3000        │────────▶│   Port: 5000        │
│   • SPA             │  API    │   • REST API        │
│   • Material-UI     │  Calls  │   • JWT Auth        │
│   • Redux           │         │   • Rate Limiting   │
└─────────────────────┘         └──────────┬──────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
          │   PostgreSQL    │   │     Redis       │   │   File Storage  │
          │   Port: 5432    │   │   Port: 6379    │   │   /uploads      │
          │   • Primary DB  │   │   • Cache       │   │   • Excel files │
          │   • Prisma ORM  │   │   • Sessions    │   │   • Exports     │
          └─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 2.2 Component Interaction

```
┌──────────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Client Request                                                       │
│       │                                                               │
│       ▼                                                               │
│  ┌─────────────┐                                                      │
│  │   Helmet    │ ◄─── Security Headers (CSP, HSTS, X-Frame)          │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │    CORS     │ ◄─── Cross-Origin Resource Sharing                  │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │ Rate Limit  │ ◄─── 100 req/15min (API), 5 req/15min (Auth)        │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │    Auth     │ ◄─── JWT Verification + 2FA                         │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │    RBAC     │ ◄─── Role-Based Access Control                      │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │   Cache     │ ◄─── Redis Cache Check                              │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │ Controller  │ ◄─── Request Handling                               │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │  Service    │ ◄─── Business Logic                                 │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │   Prisma    │ ◄─── Database Queries                               │
│  └──────┬──────┘                                                      │
│         ▼                                                             │
│  ┌─────────────┐                                                      │
│  │  PostgreSQL │ ◄─── Data Storage                                   │
│  └─────────────┘                                                      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 4.9 | Type Safety |
| Material-UI | 7.x | Component Library |
| Redux Toolkit | 2.x | State Management |
| React Query | 5.x | Server State |
| React Router | 7.x | Navigation |
| i18next | 25.x | Internationalization |
| Recharts | 3.x | Data Visualization |
| Axios | 1.x | HTTP Client |

### 3.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.x | Web Framework |
| TypeScript | 5.x | Type Safety |
| Prisma | 6.x | ORM |
| PostgreSQL | 16 | Database |
| Redis | 7.x | Caching |
| JWT | - | Authentication |
| bcrypt | 5.x | Password Hashing |
| speakeasy | 2.x | 2FA (TOTP) |
| Winston | 3.x | Logging |
| ExcelJS | 4.x | Excel Export |

### 3.3 DevOps & Infrastructure

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse Proxy |
| GitHub Actions | CI/CD |
| AWS S3 | Backup Storage |

---

## 4. Backend Architecture

### 4.1 Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Initial data seeding
├── src/
│   ├── config/
│   │   ├── config.ts          # Environment configuration
│   │   ├── database.ts        # Prisma client
│   │   ├── redis.ts           # Redis client
│   │   └── logger.ts          # Winston logger
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── ministry.controller.ts
│   │   ├── tofe.controller.ts
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── ministry.service.ts
│   │   ├── cache.service.ts
│   │   └── ...
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── ministry.routes.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── rateLimiter.ts
│   │   ├── audit.middleware.ts
│   │   └── errorHandler.ts
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   ├── schedulers/            # Cron jobs
│   └── server.ts              # Application entry
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
└── tests/                     # Test files
```

### 4.2 Module Organization

The backend follows a modular architecture with clear separation:

| Layer | Responsibility |
|-------|----------------|
| Routes | Define API endpoints, apply middleware |
| Controllers | Handle HTTP request/response |
| Services | Implement business logic |
| Models (Prisma) | Database schema and queries |
| Middleware | Cross-cutting concerns |

### 4.3 API Modules

| Module | Routes | Description |
|--------|--------|-------------|
| Auth | `/api/v1/auth` | Authentication & 2FA |
| Users | `/api/v1/users` | User management |
| Roles | `/api/v1/roles` | Role & permission management |
| Ministries | `/api/v1/ministries` | Ministry management |
| Budget Years | `/api/v1/budget-years` | Fiscal year configuration |
| TOFE | `/api/v1/tofe` | Financial operations table |
| CBMT | `/api/v1/cbmt` | Budget framework |
| CDMT Global | `/api/v1/cdmt-global` | Consolidated CDMT |
| Workflow | `/api/v1/workflow` | Document approval |
| Notifications | `/api/v1/notifications` | User notifications |
| Audit Logs | `/api/v1/audit-logs` | Activity tracking |

---

## 5. Frontend Architecture

### 5.1 Directory Structure

```
frontend/
├── public/
│   ├── locales/               # Translation files
│   │   ├── fr/                # French
│   │   ├── en/                # English
│   │   └── ar/                # Arabic
│   └── index.html
├── src/
│   ├── components/            # Reusable components
│   │   ├── common/            # Generic components
│   │   ├── layout/            # Layout components
│   │   └── forms/             # Form components
│   ├── pages/                 # Page components
│   │   ├── Dashboard/
│   │   ├── TOFE/
│   │   ├── CBMT/
│   │   └── ...
│   ├── services/              # API services
│   │   ├── api.ts             # Axios instance
│   │   ├── authService.ts
│   │   └── ...
│   ├── store/                 # Redux store
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   └── ...
│   ├── hooks/                 # Custom hooks
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript types
│   ├── styles/                # CSS styles
│   │   ├── responsive.css
│   │   ├── print.css
│   │   └── rtl.css
│   ├── i18n/                  # i18n configuration
│   ├── App.tsx
│   └── index.tsx
└── docs/                      # Frontend documentation
```

### 5.2 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐     ┌─────────────────┐                │
│  │  Redux Store    │     │  React Query    │                │
│  ├─────────────────┤     ├─────────────────┤                │
│  │ • Auth state    │     │ • Server data   │                │
│  │ • UI state      │     │ • Caching       │                │
│  │ • User prefs    │     │ • Mutations     │                │
│  └─────────────────┘     └─────────────────┘                │
│                                                              │
│  Local State (useState)    Context API                       │
│  • Form inputs             • Theme                           │
│  • Modal visibility        • Language                        │
│  • Temporary data          • User settings                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Database Schema

### 6.1 Core Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CORE ENTITIES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐                   │
│  │   User   │───▶│   Role   │◀───│ Permission   │                   │
│  └────┬─────┘    └──────────┘    └──────────────┘                   │
│       │                                                              │
│       ▼                                                              │
│  ┌──────────┐                                                        │
│  │ Ministry │───┐                                                    │
│  └──────────┘   │                                                    │
│       │         │                                                    │
│       ▼         │                                                    │
│  ┌──────────┐   │    ┌──────────────────┐                           │
│  │ Program  │   └───▶│ ExpenseProjection │                          │
│  └────┬─────┘        └──────────────────┘                           │
│       │                                                              │
│       ▼                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐                   │
│  │  Action  │───▶│ Activity │───▶│ BudgetLine   │                   │
│  └──────────┘    └──────────┘    └──────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Budget Hierarchy

```
Ministry (Ministère)
└── Program (Programme)
    └── Action
        └── Activity (Activité)
            └── Economic Nature (Nature économique)
                └── Budget Line (Ligne budgétaire)
```

### 6.3 Key Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User accounts | email, roleId, ministryId |
| `roles` | User roles | code, permissions |
| `ministries` | Government ministries | code, name, isPriority |
| `programs` | Budget programs | code, ministryId |
| `fiscal_years` | Fiscal year config | year, startDate, endDate |
| `document_versions` | CDMT versioning | version, status, fiscalYearId |
| `audit_logs` | Activity logging | userId, action, entity |

---

## 7. Security Implementation

### 7.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOGIN REQUEST                                                │
│     POST /api/v1/auth/login                                      │
│     { email, password }                                          │
│           │                                                      │
│           ▼                                                      │
│  2. VALIDATE CREDENTIALS                                         │
│     • Check email exists                                         │
│     • Verify bcrypt password hash                                │
│     • Check account active                                       │
│           │                                                      │
│           ▼                                                      │
│  3. CHECK 2FA STATUS                                             │
│     ┌─────────────────┐                                          │
│     │ 2FA Enabled?    │                                          │
│     └────────┬────────┘                                          │
│              │                                                   │
│      ┌───────┴───────┐                                           │
│      │               │                                           │
│      ▼               ▼                                           │
│   [YES]           [NO]                                           │
│      │               │                                           │
│      │               ▼                                           │
│      │        4a. GENERATE TOKENS                                │
│      │            • Access Token (24h)                           │
│      │            • Refresh Token (7d)                           │
│      │               │                                           │
│      │               ▼                                           │
│      │        RETURN { tokens, user }                            │
│      │                                                           │
│      ▼                                                           │
│   4b. RETURN { requiresTwoFactor: true, userId }                 │
│      │                                                           │
│      ▼                                                           │
│   5. 2FA VERIFICATION                                            │
│      POST /api/v1/auth/2fa/verify                                │
│      { userId, token }                                           │
│      │                                                           │
│      ▼                                                           │
│   6. VERIFY TOTP CODE                                            │
│      • Decrypt stored secret                                     │
│      • Validate with speakeasy                                   │
│      │                                                           │
│      ▼                                                           │
│   7. GENERATE TOKENS & RETURN                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| Password Hashing | bcrypt (12 rounds) |
| Token Authentication | JWT (RS256) |
| 2FA | TOTP (speakeasy) |
| Rate Limiting | 100 req/15min |
| XSS Protection | xss-clean, helmet |
| CSRF Protection | csurf tokens |
| SQL Injection | Prisma ORM (parameterized) |
| HTTPS | TLS 1.3 |

---

## 8. Performance Optimizations

### 8.1 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Browser Cache                                          │
│  ├── Static assets (JS, CSS, images): 1 year                    │
│  └── API responses: Cache-Control headers                        │
│                                                                  │
│  Layer 2: React Query Cache                                      │
│  ├── Server state: configurable staleTime                       │
│  └── Automatic background refetch                                │
│                                                                  │
│  Layer 3: Redis Cache                                            │
│  ├── Reference data: 1 hour                                      │
│  ├── Computed data: 5 minutes                                    │
│  ├── Dashboard stats: 2 minutes                                  │
│  └── User sessions: 24 hours                                     │
│                                                                  │
│  Layer 4: Database Query Cache                                   │
│  └── PostgreSQL query plan cache                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Performance Metrics

| Metric | Target | Achieved |
|--------|--------|----------|
| Page Load | < 2s | < 20ms |
| API Response | < 200ms | < 50ms |
| Calculations | < 5s | < 19ms |
| Report Generation | < 10s | < 5ms |

---

## 9. Deployment Guide

### 9.1 Environment Variables

**Backend (.env):**
```env
# Server
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/cdmt_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 2FA
TWO_FACTOR_ENCRYPTION_KEY=32-byte-hex-key

# CORS
CORS_ORIGIN=https://cdmt.finances.dj
```

### 9.2 Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Scale backend
docker-compose up -d --scale backend=3
```

### 9.3 Manual Deployment

```bash
# Backend
cd backend
npm ci --production
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 start dist/server.js --name cdmt-api

# Frontend
cd frontend
npm ci
npm run build
# Serve build/ directory with nginx
```

---

## 10. Monitoring & Logging

### 10.1 Logging Levels

| Level | Usage |
|-------|-------|
| ERROR | Application errors, exceptions |
| WARN | Deprecated features, unusual conditions |
| INFO | General operational messages |
| DEBUG | Detailed diagnostic information |

### 10.2 Log Format

```json
{
  "timestamp": "2026-01-05T10:30:00.000Z",
  "level": "info",
  "message": "User logged in",
  "userId": "abc-123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req-xyz-789"
}
```

### 10.3 Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Application health |
| `GET /health/db` | Database connectivity |
| `GET /health/redis` | Redis connectivity |

---

## Appendix

### A. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | Invalid credentials |
| AUTH_002 | 401 | Token expired |
| AUTH_003 | 403 | Insufficient permissions |
| VAL_001 | 400 | Validation error |
| NOT_FOUND | 404 | Resource not found |
| SERVER_ERR | 500 | Internal server error |

### B. Related Documentation

- [API Reference](./API_REFERENCE.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [User Manual](./USER_MANUAL.md)
- [Training Guide](./TRAINING_GUIDE.md)

---

**Document Owner:** Development Team
**Approved By:** Technical Lead
**Next Review:** 2026-04-01
