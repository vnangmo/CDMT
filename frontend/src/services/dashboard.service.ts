import apiClient from './api.service';

// Types
export interface DashboardStats {
  sectoralMeasures: {
    total: number;
    byStatus: Record<string, number>;
    changeFromLastMonth: number;
  };
  actionPlans: {
    total: number;
    byStatus: Record<string, number>;
    changeFromLastMonth: number;
  };
  pendingValidations: {
    total: number;
    byDocumentType: Record<string, number>;
    oldestPendingDays: number;
  };
  budget: {
    totalAllocated: number;
    totalExecuted: number;
    executionRate: number;
    byMinistry: Array<{
      ministryId: string;
      ministryName: string;
      allocated: number;
      executed: number;
      rate: number;
    }>;
  };
}

export interface DashboardAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  ministryId?: string;
  ministryName?: string;
  value?: number;
  threshold?: number;
  deviation?: number;
  fiscalYear?: number;
  createdAt: string;
  isRead: boolean;
  isResolved: boolean;
}

export interface AlertsSummary {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  criticalCount: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  status?: string;
}

export interface BudgetTrend {
  period: string;
  year: number;
  month: number;
  allocated: number;
  executed: number;
  rate: number;
}

export interface MinistryComparison {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  ceilingY1: number;
  ceilingY2: number;
  ceilingY3: number;
  measuresCount: number;
  totalMeasuresAmount: number;
  executionRate: number;
}

export interface WorkflowStats {
  byStatus: Record<string, number>;
  averageProcessingDays: number;
  validationRate: number;
  rejectionRate: number;
}

export interface DashboardData {
  fiscalYear: number;
  stats: DashboardStats;
  activities: RecentActivity[];
  trends: BudgetTrend[];
  alerts: AlertsSummary;
  workflow: WorkflowStats;
  generatedAt: string;
}

class DashboardService {
  /**
   * Get complete dashboard data
   */
  async getDashboard(fiscalYear?: number): Promise<DashboardData> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await apiClient.get('/dashboard', { params });
    return response.data.data;
  }

  /**
   * Get dashboard statistics
   */
  async getStats(fiscalYear?: number): Promise<DashboardStats> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await apiClient.get('/dashboard/stats', { params });
    return response.data.data;
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 20): Promise<RecentActivity[]> {
    const response = await apiClient.get('/dashboard/activities', { params: { limit } });
    return response.data.data;
  }

  /**
   * Get budget trends
   */
  async getBudgetTrends(fiscalYear?: number, months: number = 12): Promise<BudgetTrend[]> {
    const params: any = { months };
    if (fiscalYear) params.fiscalYear = fiscalYear;
    const response = await apiClient.get('/dashboard/trends', { params });
    return response.data.data;
  }

  /**
   * Get ministry comparison
   */
  async getMinistryComparison(fiscalYear?: number): Promise<MinistryComparison[]> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await apiClient.get('/dashboard/ministries', { params });
    return response.data.data;
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(): Promise<WorkflowStats> {
    const response = await apiClient.get('/dashboard/workflow-stats');
    return response.data.data;
  }

  /**
   * Get pending validations
   */
  async getPendingValidations(): Promise<{
    total: number;
    byDocumentType: Record<string, number>;
    oldestPendingDays: number;
  }> {
    const response = await apiClient.get('/dashboard/pending-validations');
    return response.data.data;
  }

  /**
   * Get all alerts
   */
  async getAlerts(options?: {
    fiscalYear?: number;
    type?: string;
    severity?: string;
    ministryId?: string;
  }): Promise<{ alerts: DashboardAlert[]; total: number }> {
    const response = await apiClient.get('/dashboard/alerts', { params: options });
    return response.data.data;
  }

  /**
   * Get alerts summary
   */
  async getAlertsSummary(fiscalYear?: number): Promise<AlertsSummary> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await apiClient.get('/dashboard/alerts/summary', { params });
    return response.data.data;
  }

  /**
   * Get critical alerts
   */
  async getCriticalAlerts(fiscalYear?: number): Promise<{ alerts: DashboardAlert[]; total: number }> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await apiClient.get('/dashboard/alerts/critical', { params });
    return response.data.data;
  }
}

export default new DashboardService();
