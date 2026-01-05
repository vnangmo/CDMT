import prisma from '../config/database';
import { AuditLog, Prisma } from '@prisma/client';

interface AuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

interface SearchFilters {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

interface DiffResult {
  changed: string[];
  diff: Record<string, { old: any; new: any }>;
}

/**
 * Audit Log Service
 *
 * Centralized service for logging all CRUD operations with automatic diff calculation.
 * Provides methods for querying, searching, and exporting audit logs.
 */
class AuditLogService {
  /**
   * Create a single audit log entry
   */
  static async log(params: AuditLogParams): Promise<AuditLog> {
    try {
      // Calculate diff if both old and new values exist
      let processedOldValue = params.oldValue;
      let processedNewValue = params.newValue;

      if (params.oldValue && params.newValue && params.action === 'UPDATE') {
        const diffResult = this.calculateDiff(params.oldValue, params.newValue);

        // Enhance newValue with diff information
        processedNewValue = {
          ...params.newValue,
          _diff: diffResult,
        };
      }

      const auditLog = await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          oldValue: processedOldValue ? (processedOldValue as Prisma.InputJsonValue) : Prisma.JsonNull,
          newValue: processedNewValue ? (processedNewValue as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });

      console.log('[AuditLogService] Created audit log:', {
        id: auditLog.id,
        action: auditLog.action,
        entity: auditLog.entity,
        userId: auditLog.userId,
      });

      return auditLog;
    } catch (error) {
      console.error('[AuditLogService] Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Create multiple audit log entries in batch
   */
  static async logBatch(entries: AuditLogParams[]): Promise<AuditLog[]> {
    if (entries.length === 0) {
      return [];
    }

    try {
      const processedEntries = entries.map(entry => {
        let processedOldValue = entry.oldValue;
        let processedNewValue = entry.newValue;

        if (entry.oldValue && entry.newValue && entry.action === 'UPDATE') {
          const diffResult = this.calculateDiff(entry.oldValue, entry.newValue);
          processedNewValue = {
            ...entry.newValue,
            _diff: diffResult,
          };
        }

        return {
          userId: entry.userId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId || null,
          oldValue: processedOldValue ? (processedOldValue as Prisma.InputJsonValue) : Prisma.JsonNull,
          newValue: processedNewValue ? (processedNewValue as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        };
      });

      const result = await prisma.auditLog.createMany({
        data: processedEntries,
      });

      console.log(`[AuditLogService] Created ${result.count} audit logs in batch`);

      // Fetch the created logs
      const logs = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 5000) }, // Last 5 seconds
        },
        orderBy: { createdAt: 'desc' },
        take: result.count,
      });

      return logs;
    } catch (error) {
      console.error('[AuditLogService] Error creating batch audit logs:', error);
      throw error;
    }
  }

  /**
   * Log a CREATE operation
   */
  static async logCreate(
    userId: string,
    entity: string,
    entityId: string,
    newValue: any,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: 'CREATE',
      entity,
      entityId,
      newValue,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log an UPDATE operation
   */
  static async logUpdate(
    userId: string,
    entity: string,
    entityId: string,
    oldValue: any,
    newValue: any,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: 'UPDATE',
      entity,
      entityId,
      oldValue,
      newValue,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log a DELETE operation
   */
  static async logDelete(
    userId: string,
    entity: string,
    entityId: string,
    oldValue: any,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: 'DELETE',
      entity,
      entityId,
      oldValue,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log a login event
   */
  static async logLogin(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: 'LOGIN',
      entity: 'User',
      entityId: userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log a logout event
   */
  static async logLogout(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log a failed login attempt
   */
  static async logLoginFailed(
    email: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId: 'system',
      action: 'LOGIN_FAILED',
      entity: 'User',
      newValue: { email, timestamp: new Date().toISOString() },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log a password change
   */
  static async logPasswordChange(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log an export operation
   */
  static async logExport(
    userId: string,
    entity: string,
    filters: any,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: 'EXPORT',
      entity,
      newValue: { filters, timestamp: new Date().toISOString() },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  static async getByUser(
    userId: string,
    filters?: {
      action?: string;
      entity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = { userId };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entity) {
      where.entity = filters.entity;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Search audit logs with advanced filters
   */
  static async search(filters: SearchFilters): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get audit log by ID
   */
  static async getById(id: string): Promise<AuditLog | null> {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get audit statistics
   */
  static async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byEntity: Record<string, number>;
    byUser: Array<{ userId: string; userName: string; count: number }>;
  }> {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [totalLogs, actionCounts, entityCounts, userCounts] = await Promise.all([
      prisma.auditLog.count({ where }),

      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),

      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { entity: true },
      }),

      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    // Fetch user names for top users
    const userIds = userCounts.map(u => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    return {
      totalLogs,
      byAction: Object.fromEntries(actionCounts.map(a => [a.action, a._count.action])),
      byEntity: Object.fromEntries(entityCounts.map(e => [e.entity, e._count.entity])),
      byUser: userCounts.map(u => ({
        userId: u.userId,
        userName: userMap.get(u.userId) || 'Unknown',
        count: u._count.userId,
      })),
    };
  }

  /**
   * Calculate diff between old and new values
   */
  private static calculateDiff(oldValue: any, newValue: any): DiffResult {
    const changed: string[] = [];
    const diff: Record<string, { old: any; new: any }> = {};

    // Handle null/undefined cases
    if (oldValue == null || newValue == null) {
      return { changed: [], diff: {} };
    }

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldValue),
      ...Object.keys(newValue),
    ]);

    for (const key of allKeys) {
      // Skip system fields
      if (this.isSystemField(key)) {
        continue;
      }

      const oldVal = oldValue[key];
      const newVal = newValue[key];

      // Check if values are different
      if (!this.isEqual(oldVal, newVal)) {
        changed.push(key);
        diff[key] = {
          old: oldVal,
          new: newVal,
        };
      }
    }

    return { changed, diff };
  }

  /**
   * Check if a field is a system field (should be excluded from diff)
   */
  private static isSystemField(fieldName: string): boolean {
    const systemFields = [
      'id',
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy',
      '_diff', // Our own diff metadata
    ];

    return systemFields.includes(fieldName);
  }

  /**
   * Deep equality comparison
   */
  private static isEqual(a: any, b: any): boolean {
    // Strict equality
    if (a === b) {
      return true;
    }

    // Handle null/undefined
    if (a == null || b == null) {
      return a === b;
    }

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      return a.every((val, index) => this.isEqual(val, b[index]));
    }

    // Handle objects
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      return keysA.every(key => this.isEqual(a[key], b[key]));
    }

    // Default: not equal
    return false;
  }

  /**
   * Delete old audit logs (for archiving/cleanup)
   */
  static async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lte: date },
      },
    });

    console.log(`[AuditLogService] Deleted ${result.count} old audit logs`);
    return result.count;
  }
}

export default AuditLogService;
