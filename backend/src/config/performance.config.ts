/**
 * Performance Configuration for CDMT Application
 *
 * Based on requirements:
 * - REQ-PERF-01: Response times
 *   - Page display: < 2 seconds
 *   - Automatic calculations: < 5 seconds
 *   - Report generation: < 10 seconds
 *
 * - REQ-PERF-02: Capacity
 *   - Support 100+ concurrent users
 *   - Management of 50+ ministries/institutions
 *   - History over 10 years minimum
 */

export const PerformanceConfig = {
  /**
   * Response time thresholds (in milliseconds)
   */
  thresholds: {
    /** Page display operations: < 2 seconds */
    pageDisplay: 2000,
    /** Calculation operations: < 5 seconds */
    calculations: 5000,
    /** Report generation: < 10 seconds */
    reports: 10000,
  },

  /**
   * Capacity requirements
   */
  capacity: {
    /** Maximum concurrent users */
    maxConcurrentUsers: 100,
    /** Maximum ministries/institutions */
    maxMinistries: 50,
    /** Minimum years of history to maintain */
    historyYears: 10,
  },

  /**
   * Cache TTL settings (in seconds)
   */
  cacheTTL: {
    /** Reference data (ministries, roles, permissions) - 5 minutes */
    referenceData: 300,
    /** Dashboard statistics - 1 minute */
    dashboard: 60,
    /** User session data - 15 minutes */
    session: 900,
    /** Report cache - 10 minutes */
    reports: 600,
    /** Access matrix - 5 minutes */
    accessMatrix: 300,
    /** Search results - 2 minutes */
    search: 120,
  },

  /**
   * Cache keys patterns
   */
  cacheKeys: {
    roles: {
      all: 'roles:all',
      byId: (id: string) => `roles:${id}`,
      byCode: (code: string) => `roles:code:${code}`,
      statistics: 'roles:statistics',
      accessMatrix: 'roles:access-matrix',
      permissionsByModule: 'roles:permissions:by-module',
    },
    dashboard: {
      stats: 'dashboard:stats',
      alerts: 'dashboard:alerts',
      activities: 'dashboard:activities',
      trends: 'dashboard:trends',
      ministries: 'dashboard:ministries',
    },
    ministries: {
      all: 'ministries:all',
      byId: (id: string) => `ministries:${id}`,
    },
    actionPlans: {
      all: 'action-plans:all',
      byId: (id: string) => `action-plans:${id}`,
    },
  },

  /**
   * Database query optimization settings
   */
  database: {
    /** Maximum records per page for pagination */
    defaultPageSize: 20,
    /** Maximum allowed page size */
    maxPageSize: 100,
    /** Connection pool size */
    poolSize: 10,
  },

  /**
   * Rate limiting settings
   */
  rateLimit: {
    /** Window duration in minutes */
    windowMinutes: 15,
    /** Maximum requests per window */
    maxRequests: 100,
    /** Special limit for auth endpoints */
    authMaxRequests: 10,
  },

  /**
   * Compression settings
   */
  compression: {
    /** Compression level (0-9) */
    level: 6,
    /** Minimum response size to compress (bytes) */
    threshold: 1024,
  },
};

/**
 * Cache key generator helpers
 */
export const CacheKeys = {
  ...PerformanceConfig.cacheKeys,

  /**
   * Generate a cache key with user context
   */
  withUser: (baseKey: string, userId: string) => `${baseKey}:user:${userId}`,

  /**
   * Generate a cache key with fiscal year context
   */
  withFiscalYear: (baseKey: string, year: number) => `${baseKey}:fy:${year}`,

  /**
   * Generate a cache key with ministry context
   */
  withMinistry: (baseKey: string, ministryId: string) => `${baseKey}:ministry:${ministryId}`,
};

export default PerformanceConfig;
