import { Router } from 'express';
import AuditLogController from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All audit log routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/audit-logs
 * Search audit logs with filters (Admin/Director only)
 * Query params: userId, action, entity, entityId, startDate, endDate, limit, offset
 */
router.get(
  '/',
  authorize(['ADMIN', 'DIRECTOR']),
  AuditLogController.search
);

/**
 * GET /api/v1/audit-logs/stats
 * Get audit statistics (Admin/Director only)
 * Query params: startDate, endDate
 */
router.get(
  '/stats',
  authorize(['ADMIN', 'DIRECTOR']),
  AuditLogController.getStatistics
);

/**
 * GET /api/v1/audit-logs/export/csv
 * Export audit logs to CSV (Admin/Director only)
 * Query params: userId, action, entity, startDate, endDate
 */
router.get(
  '/export/csv',
  authorize(['ADMIN', 'DIRECTOR']),
  AuditLogController.exportToCsv
);

/**
 * GET /api/v1/audit-logs/me/logs
 * Get current user's own audit logs
 * Query params: action, entity, startDate, endDate, limit, offset
 */
router.get('/me/logs', AuditLogController.getMyLogs);

/**
 * GET /api/v1/audit-logs/entity/:entity/:entityId
 * Get audit logs for a specific entity (Admin/Director only)
 */
router.get(
  '/entity/:entity/:entityId',
  authorize(['ADMIN', 'DIRECTOR']),
  AuditLogController.getByEntity
);

/**
 * GET /api/v1/audit-logs/:id
 * Get audit log by ID (Admin/Director only)
 */
router.get(
  '/:id',
  authorize(['ADMIN', 'DIRECTOR']),
  AuditLogController.getById
);

export default router;
