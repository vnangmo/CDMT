import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
// @ts-ignore - xss-clean doesn't have types
import xssClean from 'xss-clean';
// @ts-ignore - hpp doesn't have types
import hpp from 'hpp';
import dotenv from 'dotenv';
import { config } from './config/config';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { conditionalCsrfProtection, getCsrfToken, csrfErrorHandler } from './middleware/csrf.middleware';
import { auditContextMiddleware } from './middleware/auditContext.middleware';

// Global error handlers for debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware - Enhanced Helmet configuration
app.use(helmet({
  // Content Security Policy - Prevents XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Allow inline styles for React
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // HTTP Strict Transport Security - Forces HTTPS
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Prevent clickjacking attacks
  frameguard: {
    action: 'deny',
  },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Prevent MIME type sniffing
  noSniff: true,
  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware (required for CSRF protection)
app.use(cookieParser());

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Compression middleware (gzip/brotli) - 60-80% response size reduction
app.use(compression({
  level: 6,  // Compression level (0-9)
  threshold: 1024,  // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Security middleware - Sanitize user input to prevent XSS attacks
app.use(xssClean());

// Security middleware - Prevent HTTP Parameter Pollution attacks
app.use(hpp({
  whitelist: [
    // Allow duplicate parameters for filters/arrays
    'page', 'limit', 'sort', 'status', 'ministryId', 'fiscalYear'
  ]
}));

// Audit context middleware (must be before routes)
app.use(auditContextMiddleware);

// CSRF Protection middleware (must be after cookieParser and before routes)
app.use(conditionalCsrfProtection);

// ============================================
// ROUTES
// ============================================
// Updated: Added 4 new referential routes

// CSRF Token endpoint - frontend calls this to get a token before state-changing requests
app.get('/api/v1/csrf-token', getCsrfToken);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'CDMT API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API routes
app.get(config.apiPrefix, (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to CDMT API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: config.apiPrefix,
      auth: `${config.apiPrefix}/auth`,
      référentiels: {
        ministries: `${config.apiPrefix}/ministries`,
        economicCategories: `${config.apiPrefix}/economic-categories`,
        financingSources: `${config.apiPrefix}/financing-sources`,
        functionalClassifications: `${config.apiPrefix}/functional-classifications`,
        programmaticStructure: `${config.apiPrefix}/programmatic-structure`,
        strategicAxes: `${config.apiPrefix}/strategic-axes`,
        economicNatures: `${config.apiPrefix}/economic-natures`,
        fundingSources: `${config.apiPrefix}/funding-sources`,
        fiscalYears: `${config.apiPrefix}/fiscal-years`,
      },
      budget: {
        years: `${config.apiPrefix}/budget-years`,
        versions: `${config.apiPrefix}/document-versions`,
      },
      import: {
        budgets: `${config.apiPrefix}/import/budgets`,
        executions: `${config.apiPrefix}/import/executions`,
        pie: `${config.apiPrefix}/import/pie`,
        pip: `${config.apiPrefix}/import/pip`,
        history: `${config.apiPrefix}/import/history`,
      },
      users: `${config.apiPrefix}/users`,
    },
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import ministryRoutes from './routes/ministry.routes';
import economicCategoryRoutes from './routes/economicCategory.routes';
import financingSourceRoutes from './routes/financingSource.routes';
import functionalClassificationRoutes from './routes/functionalClassification.routes';
import programRoutes from './routes/program.routes';
import strategicAxisRoutes from './routes/strategicAxis.routes';
import economicNatureRoutes from './routes/economicNature.routes';
import fundingSourceRoutes from './routes/fundingSource.routes';
import fiscalYearRoutes from './routes/fiscalYear.routes';
import budgetYearRoutes from './routes/budgetYear.routes';
import documentVersionRoutes from './routes/documentVersion.routes';
import importRoutes from './routes/import.routes';
import macroFrameworkRoutes from './routes/macroFramework.routes';
import revenueProjectionRoutes from './routes/revenueProjection.routes';
import expenseProjectionRoutes from './routes/expenseProjection.routes';
import tofeRoutes from './routes/tofe.routes';
import cbmtRoutes from './routes/cbmt.routes';
import trendBudgetRoutes from './routes/trendBudget.routes';
import cdmtGlobalRoutes from './routes/cdmtGlobal.routes';
import objectiveRoutes from './routes/objective.routes';
import indicatorRoutes from './routes/indicator.routes';
import pieProjectRoutes from './routes/pieProject.routes';
import pipProjectRoutes from './routes/pipProject.routes';
import sectoralTrendRoutes from './routes/sectoralTrend.routes';
import sectoralMeasureRoutes from './routes/sectoralMeasure.routes';
import actionPlanRoutes from './routes/actionPlan.routes';
import workflowRoutes from './routes/workflow.routes';
import commentRoutes from './routes/comment.routes';
import notificationRoutes from './routes/notification.routes';
import auditLogRoutes from './routes/auditLog.routes';
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import dashboardRoutes from './routes/dashboard.routes';
import customExportRoutes from './routes/customExport.routes';
import roleRoutes from './routes/role.routes';
import permissionRoutes from './routes/permission.routes';
import cdsmtSynthesisRoutes from './routes/cdsmtSynthesis.routes';
import helpCenterRoutes from './routes/helpCenter.routes';
import backupRoutes from './routes/backup.routes';
import budgetLineRoutes from './routes/budgetLine.routes';
import importTemplateRoutes from './routes/importTemplate.routes';
import fiscalMarginRoutes from './routes/fiscalMargin.routes';

// Import audit and scheduler utilities
import { setupAuditMiddleware } from './middleware/audit.middleware';
import { setupReminderScheduler } from './schedulers/reminder.scheduler';
import prisma from './config/database';
import { redisClient } from './config/redis';

// Import rate limiters
import { apiLimiter } from './middleware/rateLimiter';

// Apply rate limiting to all API routes (100 requests per 15 minutes)
app.use(config.apiPrefix, apiLimiter);

// Auth routes
app.use(`${config.apiPrefix}/auth`, authRoutes);

// Référentiels routes
app.use(`${config.apiPrefix}/ministries`, ministryRoutes);
app.use(`${config.apiPrefix}/economic-categories`, economicCategoryRoutes);
app.use(`${config.apiPrefix}/financing-sources`, financingSourceRoutes);
app.use(`${config.apiPrefix}/functional-classifications`, functionalClassificationRoutes);
app.use(`${config.apiPrefix}/programmatic-structure`, programRoutes);
app.use(`${config.apiPrefix}/programs`, programRoutes);
app.use(`${config.apiPrefix}/objectives`, objectiveRoutes);
app.use(`${config.apiPrefix}/indicators`, indicatorRoutes);
app.use(`${config.apiPrefix}/strategic-axes`, strategicAxisRoutes);
app.use(`${config.apiPrefix}/economic-natures`, economicNatureRoutes);
app.use(`${config.apiPrefix}/funding-sources`, fundingSourceRoutes);
app.use(`${config.apiPrefix}/fiscal-years`, fiscalYearRoutes);

// Budget and versioning routes
app.use(`${config.apiPrefix}/budget-years`, budgetYearRoutes);
app.use(`${config.apiPrefix}/document-versions`, documentVersionRoutes);

// Import routes
app.use(`${config.apiPrefix}/import`, importRoutes);

// Macro framework routes
app.use(`${config.apiPrefix}/macro-frameworks`, macroFrameworkRoutes);
app.use(`${config.apiPrefix}/revenue-projections`, revenueProjectionRoutes);
app.use(`${config.apiPrefix}/expense-projections`, expenseProjectionRoutes);
app.use(`${config.apiPrefix}/tofe`, tofeRoutes);
app.use(`${config.apiPrefix}/cbmt`, cbmtRoutes);

// Trend budget routes
app.use(`${config.apiPrefix}/trend-budgets`, trendBudgetRoutes);

// CDMT Global routes
app.use(`${config.apiPrefix}/cdmt-global`, cdmtGlobalRoutes);

// Sectoral Trend routes
app.use(`${config.apiPrefix}/sectoral-trends`, sectoralTrendRoutes);

// Sectoral Measure and Action Plan routes
app.use(`${config.apiPrefix}/sectoral-measures`, sectoralMeasureRoutes);
app.use(`${config.apiPrefix}/action-plans`, actionPlanRoutes);

// Workflow and Comment routes
app.use(`${config.apiPrefix}/workflow`, workflowRoutes);
app.use(`${config.apiPrefix}/comments`, commentRoutes);

// PIE/PIP Project routes
app.use(`${config.apiPrefix}/pie-projects`, pieProjectRoutes);
app.use(`${config.apiPrefix}/pip-projects`, pipProjectRoutes);

// Notification and Audit Log routes
app.use(`${config.apiPrefix}/notifications`, notificationRoutes);
app.use(`${config.apiPrefix}/audit-logs`, auditLogRoutes);

// User and Settings routes
app.use(`${config.apiPrefix}/users`, userRoutes);
app.use(`${config.apiPrefix}/settings`, settingsRoutes);

// Dashboard routes
app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);

// Custom Export routes
app.use(`${config.apiPrefix}/export`, customExportRoutes);

// Role and Permission management routes
app.use(`${config.apiPrefix}/roles`, roleRoutes);
app.use(`${config.apiPrefix}/permissions`, permissionRoutes);

// CDSMT Synthesis routes (Maquette CDSMT - Figure 10 du guide)
app.use(`${config.apiPrefix}/cdsmt-synthesis`, cdsmtSynthesisRoutes);

// Help Center routes (Support tickets, Favorites, Feedback, History)
app.use(`${config.apiPrefix}/help`, helpCenterRoutes);

// Backup routes (Database backup and restore)
app.use(`${config.apiPrefix}/backup`, backupRoutes);

// Budget lines routes (Historical budget data)
app.use(`${config.apiPrefix}/budget-lines`, budgetLineRoutes);

// Import templates routes (Download CSV models)
app.use(`${config.apiPrefix}/import-templates`, importTemplateRoutes);

// Fiscal Margins routes (Marges de manœuvre)
app.use(`${config.apiPrefix}/fiscal-margins`, fiscalMarginRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

// CSRF error handler (must be before general error handler)
app.use(csrfErrorHandler);

// Error handling middleware
app.use(errorHandler);

// ============================================
// INITIALIZE AUDIT & SCHEDULER
// ============================================

// Setup Prisma audit middleware for automatic CRUD logging
setupAuditMiddleware(prisma);
logger.info('Audit middleware initialized');

// Setup reminder scheduler (daily at 8 AM EAT)
setupReminderScheduler();
logger.info('Reminder scheduler initialized');

// ============================================
// SERVER START
// ============================================

const PORT = config.port || 5000;

// Initialize Redis and start server
const startServer = async () => {
  // Initialize Redis cache (with graceful degradation)
  await redisClient.connect();

  const server = app.listen(PORT, () => {
    logger.info(`
      ================================================
      🚀 CDMT API Server
      ================================================
      Environment: ${config.env}
      Port: ${PORT}
      API Prefix: ${config.apiPrefix}
      URL: http://localhost:${PORT}
      Health: http://localhost:${PORT}/health
      Redis: ${redisClient.isReady() ? 'Connected' : 'Unavailable (degraded mode)'}
      ================================================
    `);
  });

  return server;
};

// Start the server
let server: any;
startServer().then(s => {
  server = s;
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await redisClient.disconnect();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await redisClient.disconnect();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
