import { Prisma, PrismaClient } from '@prisma/client';
import { getCurrentUserId, getCurrentMetadata } from '../utils/auditContext';
import AuditLogService from '../services/auditLog.service';

/**
 * Models to skip from automatic audit logging
 *
 * - AuditLog: Avoid infinite loop when logging audit operations
 * - Notification: High volume, not critical for audit
 * - Session: Temporary data, not needed in audit
 */
const SKIP_MODELS = new Set(['AuditLog', 'Notification', 'Session']);

/**
 * Setup Prisma middleware for automatic audit logging
 *
 * This middleware intercepts ALL Prisma operations (create, update, delete)
 * and automatically logs them to the AuditLog table.
 *
 * Features:
 * - Automatic logging of CREATE, UPDATE, DELETE operations
 * - Captures old and new values for updates
 * - Uses AsyncLocalStorage to get user context
 * - Skips audit-related models to avoid infinite loops
 * - Handles errors gracefully (logs but doesn't break operations)
 *
 * @param prisma - The Prisma client instance
 *
 * @example
 * ```typescript
 * // In your server initialization:
 * import prisma from './prisma/client';
 * import { setupAuditMiddleware } from './middleware/audit.middleware';
 *
 * setupAuditMiddleware(prisma);
 * ```
 */
export function setupAuditMiddleware(prisma: PrismaClient): void {
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    // Execute the operation first
    const result = await next(params);

    // Skip if no model name (raw queries, etc.)
    if (!params.model) {
      return result;
    }

    // Skip models that should not be audited
    if (SKIP_MODELS.has(params.model)) {
      return result;
    }

    // Get user context from AsyncLocalStorage
    const userId = getCurrentUserId();

    // If no user context, skip audit logging
    // This happens for:
    // - System operations (migrations, seeds)
    // - Unauthenticated operations
    if (!userId) {
      return result;
    }

    // Get metadata (IP address, user agent)
    const metadata = getCurrentMetadata();

    try {
      // Log based on operation type
      switch (params.action) {
        case 'create':
          await handleCreate(params, result, userId, metadata);
          break;

        case 'createMany':
          await handleCreateMany(params, result, userId, metadata);
          break;

        case 'update':
          await handleUpdate(params, result, userId, metadata, prisma);
          break;

        case 'updateMany':
          await handleUpdateMany(params, result, userId, metadata);
          break;

        case 'delete':
          await handleDelete(params, userId, metadata, prisma);
          break;

        case 'deleteMany':
          await handleDeleteMany(params, userId, metadata);
          break;

        case 'upsert':
          await handleUpsert(params, result, userId, metadata, prisma);
          break;

        default:
          // Other operations (findMany, findUnique, etc.) are not audited
          break;
      }
    } catch (error) {
      // Log error but don't break the operation
      console.error('[AuditMiddleware] Error logging audit:', error);
    }

    return result;
  });

  console.log('[AuditMiddleware] Automatic audit logging enabled');
}

/**
 * Handle CREATE operation
 */
async function handleCreate(
  params: Prisma.MiddlewareParams,
  result: any,
  userId: string,
  metadata: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const entityId = result.id || result.code || 'unknown';

  await AuditLogService.logCreate(
    userId,
    params.model!,
    entityId,
    result,
    metadata
  );
}

/**
 * Handle CREATE MANY operation
 */
async function handleCreateMany(
  params: Prisma.MiddlewareParams,
  result: any,
  userId: string,
  metadata: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  // For createMany, we log a single entry with count
  await AuditLogService.log({
    userId,
    action: 'CREATE_MANY',
    entity: params.model!,
    newValue: {
      count: result.count,
      timestamp: new Date().toISOString(),
    },
    ...metadata,
  });
}

/**
 * Handle UPDATE operation
 */
async function handleUpdate(
  params: Prisma.MiddlewareParams,
  result: any,
  userId: string,
  metadata: { ipAddress?: string; userAgent?: string },
  prisma: PrismaClient
): Promise<void> {
  const entityId = result.id || result.code || 'unknown';

  // Try to fetch old value
  let oldValue = null;
  try {
    // Use the where clause to find the previous value
    // @ts-ignore - Dynamic model access
    oldValue = await prisma[params.model!.charAt(0).toLowerCase() + params.model!.slice(1)].findUnique({
      where: params.args.where,
    });
  } catch (error) {
    console.error('[AuditMiddleware] Error fetching old value:', error);
  }

  await AuditLogService.logUpdate(
    userId,
    params.model!,
    entityId,
    oldValue,
    result,
    metadata
  );
}

/**
 * Handle UPDATE MANY operation
 */
async function handleUpdateMany(
  params: Prisma.MiddlewareParams,
  result: any,
  userId: string,
  metadata: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await AuditLogService.log({
    userId,
    action: 'UPDATE_MANY',
    entity: params.model!,
    newValue: {
      count: result.count,
      where: params.args.where,
      data: params.args.data,
      timestamp: new Date().toISOString(),
    },
    ...metadata,
  });
}

/**
 * Handle DELETE operation
 */
async function handleDelete(
  params: Prisma.MiddlewareParams,
  userId: string,
  metadata: { ipAddress?: string; userAgent?: string },
  prisma: PrismaClient
): Promise<void> {
  // Fetch the record before it's deleted
  let oldValue = null;
  let entityId = 'unknown';

  try {
    // @ts-ignore - Dynamic model access
    oldValue = await prisma[params.model!.charAt(0).toLowerCase() + params.model!.slice(1)].findUnique({
      where: params.args.where,
    });

    if (oldValue) {
      entityId = oldValue.id || oldValue.code || 'unknown';
    }
  } catch (error) {
    console.error('[AuditMiddleware] Error fetching record for delete:', error);
  }

  await AuditLogService.logDelete(
    userId,
    params.model!,
    entityId,
    oldValue,
    metadata
  );
}

/**
 * Handle DELETE MANY operation
 */
async function handleDeleteMany(
  params: Prisma.MiddlewareParams,
  userId: string,
  metadata: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await AuditLogService.log({
    userId,
    action: 'DELETE_MANY',
    entity: params.model!,
    oldValue: {
      where: params.args.where,
      timestamp: new Date().toISOString(),
    },
    ...metadata,
  });
}

/**
 * Handle UPSERT operation
 */
async function handleUpsert(
  params: Prisma.MiddlewareParams,
  result: any,
  userId: string,
  metadata: { ipAddress?: string; userAgent?: string },
  prisma: PrismaClient
): Promise<void> {
  const entityId = result.id || result.code || 'unknown';

  // Check if this was an update or create
  let oldValue = null;
  try {
    // @ts-ignore - Dynamic model access
    oldValue = await prisma[params.model!.charAt(0).toLowerCase() + params.model!.slice(1)].findUnique({
      where: params.args.where,
    });
  } catch (error) {
    console.error('[AuditMiddleware] Error checking upsert operation:', error);
  }

  if (oldValue) {
    // This was an update
    await AuditLogService.logUpdate(
      userId,
      params.model!,
      entityId,
      oldValue,
      result,
      metadata
    );
  } else {
    // This was a create
    await AuditLogService.logCreate(
      userId,
      params.model!,
      entityId,
      result,
      metadata
    );
  }
}
