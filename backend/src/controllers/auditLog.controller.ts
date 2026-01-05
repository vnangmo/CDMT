import { Request, Response, NextFunction } from 'express';
import AuditLogService from '../services/auditLog.service';

/**
 * Audit Log Controller
 *
 * Handles HTTP requests for audit log viewing and management
 * Admin and Director only
 */
class AuditLogController {
  /**
   * Search audit logs with filters
   * GET /api/v1/audit-logs
   */
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, action, entity, entityId, startDate, endDate, limit, offset } = req.query;

      const result = await AuditLogService.search({
        userId: userId as string,
        action: action as string,
        entity: entity as string,
        entityId: entityId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit log by ID
   * GET /api/v1/audit-logs/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const log = await AuditLogService.getById(id);

      if (!log) {
        res.status(404).json({ error: 'Audit log not found' });
        return;
      }

      res.json(log);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit logs for a specific entity
   * GET /api/v1/audit-logs/entity/:entity/:entityId
   */
  static async getByEntity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entity, entityId } = req.params;

      const logs = await AuditLogService.getByEntity(entity, entityId);

      res.json({ logs, total: logs.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's audit logs
   * GET /api/v1/audit-logs/me/logs
   */
  static async getMyLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { action, entity, startDate, endDate, limit, offset } = req.query;

      const result = await AuditLogService.getByUser(userId, {
        action: action as string,
        entity: entity as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export audit logs to CSV
   * GET /api/v1/audit-logs/export/csv
   */
  static async exportToCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, action, entity, startDate, endDate } = req.query;

      const result = await AuditLogService.search({
        userId: userId as string,
        action: action as string,
        entity: entity as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: 10000, // Max export limit
      });

      // Convert to CSV
      const csvLines: string[] = [];

      // Header
      csvLines.push('ID,User,Email,Role,Action,Entity,Entity ID,IP Address,User Agent,Created At');

      // Rows
      for (const log of result.logs) {
        // @ts-ignore
        const user = log.user;
        csvLines.push([
          log.id,
          user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          user?.email || '',
          user?.role?.name || '',
          log.action,
          log.entity,
          log.entityId || '',
          log.ipAddress || '',
          log.userAgent || '',
          log.createdAt.toISOString(),
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
      }

      const csv = csvLines.join('\n');

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);

      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit statistics
   * GET /api/v1/audit-logs/stats
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const stats = await AuditLogService.getStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export default AuditLogController;
