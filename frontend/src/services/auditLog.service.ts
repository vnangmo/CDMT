import api from '../config/api';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: {
      name: string;
    };
  };
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
}

export interface AuditStats {
  totalLogs: number;
  totalUsers: number;
  actionCounts: Record<string, number>;
  entityCounts: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

class AuditLogService {
  /**
   * Search audit logs with filters
   */
  async search(params?: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.entity) queryParams.append('entity', params.entity);
    if (params?.entityId) queryParams.append('entityId', params.entityId);
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await api.get(`/audit-logs?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get audit log by ID
   */
  async getById(id: string): Promise<AuditLog> {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  }

  /**
   * Get audit logs for a specific entity
   */
  async getByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const response = await api.get(`/audit-logs/entity/${entity}/${entityId}`);
    return response.data.logs;
  }

  /**
   * Get current user's audit logs
   */
  async getMyLogs(params?: {
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.action) queryParams.append('action', params.action);
    if (params?.entity) queryParams.append('entity', params.entity);
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await api.get(`/audit-logs/me/logs?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get audit statistics
   */
  async getStatistics(params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditStats> {
    const queryParams = new URLSearchParams();

    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());

    const response = await api.get(`/audit-logs/stats?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Export audit logs to CSV
   */
  async exportToCsv(params?: {
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<void> {
    const queryParams = new URLSearchParams();

    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.entity) queryParams.append('entity', params.entity);
    if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());

    const response = await api.get(`/audit-logs/export/csv?${queryParams.toString()}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export default new AuditLogService();
