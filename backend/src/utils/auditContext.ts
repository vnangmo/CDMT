import { AsyncLocalStorage } from 'async_hooks';

/**
 * Audit Context Interface
 *
 * Contains information about the current request/user
 * that should be included in audit logs
 */
export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AsyncLocalStorage instance for managing audit context
 *
 * This allows us to track user context across async operations
 * without explicitly passing it through every function call
 */
const auditContext = new AsyncLocalStorage<AuditContext>();

/**
 * Run a function within an audit context
 *
 * @param context - The audit context to set
 * @param fn - The function to run within the context
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const result = runWithAuditContext(
 *   { userId: 'user-123', ipAddress: '192.168.1.1' },
 *   async () => {
 *     // All code here and all async operations it spawns
 *     // will have access to this audit context
 *     await someService.doSomething();
 *   }
 * );
 * ```
 */
export function runWithAuditContext<T>(context: AuditContext, fn: () => T): T {
  return auditContext.run(context, fn);
}

/**
 * Get the current user ID from the audit context
 *
 * @returns The user ID if available, undefined otherwise
 *
 * @example
 * ```typescript
 * const userId = getCurrentUserId();
 * if (userId) {
 *   await AuditLogService.logCreate(userId, 'Document', doc.id, doc);
 * }
 * ```
 */
export function getCurrentUserId(): string | undefined {
  const store = auditContext.getStore();
  return store?.userId;
}

/**
 * Get the current IP address from the audit context
 *
 * @returns The IP address if available, undefined otherwise
 */
export function getCurrentIpAddress(): string | undefined {
  const store = auditContext.getStore();
  return store?.ipAddress;
}

/**
 * Get the current user agent from the audit context
 *
 * @returns The user agent if available, undefined otherwise
 */
export function getCurrentUserAgent(): string | undefined {
  const store = auditContext.getStore();
  return store?.userAgent;
}

/**
 * Get all metadata from the audit context
 *
 * @returns An object containing ipAddress and userAgent
 *
 * @example
 * ```typescript
 * const metadata = getCurrentMetadata();
 * await AuditLogService.logUpdate(userId, 'User', id, oldValue, newValue, metadata);
 * ```
 */
export function getCurrentMetadata(): { ipAddress?: string; userAgent?: string } {
  const store = auditContext.getStore();
  return {
    ipAddress: store?.ipAddress,
    userAgent: store?.userAgent,
  };
}

/**
 * Get the full audit context
 *
 * @returns The complete audit context if available, undefined otherwise
 */
export function getAuditContext(): AuditContext | undefined {
  return auditContext.getStore();
}

/**
 * Check if we are currently within an audit context
 *
 * @returns True if an audit context is available, false otherwise
 */
export function hasAuditContext(): boolean {
  return auditContext.getStore() !== undefined;
}
