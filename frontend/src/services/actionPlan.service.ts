import api from '../config/api';
import {
  ActionPlan,
  CreateActionPlanDto,
  UpdateActionPlanDto,
  ActionPlanFilters,
  ActionPlanSummary,
  PerformanceIndicators,
  ActionPlanActivity,
  CreateActivityDto,
  UpdateActivityDto,
  ActivitiesSummary,
  CriticalPath,
  BulkImportResult,
  ActivityOrder,
} from '../types/actionPlan.types';

class ActionPlanService {
  // ========== ACTION PLAN METHODS ==========

  /**
   * Get all action plans with optional filters
   */
  async getActionPlans(filters?: ActionPlanFilters): Promise<ActionPlan[]> {
    const response = await api.get('/action-plans', { params: filters });
    return response.data;
  }

  /**
   * Get a single action plan by ID
   */
  async getActionPlan(id: string): Promise<ActionPlan> {
    const response = await api.get(`/action-plans/${id}`);
    return response.data;
  }

  /**
   * Create a new action plan
   */
  async createActionPlan(data: CreateActionPlanDto): Promise<ActionPlan> {
    const response = await api.post('/action-plans', data);
    return response.data;
  }

  /**
   * Update an existing action plan
   */
  async updateActionPlan(id: string, data: UpdateActionPlanDto): Promise<ActionPlan> {
    const response = await api.put(`/action-plans/${id}`, data);
    return response.data;
  }

  /**
   * Delete an action plan
   */
  async deleteActionPlan(id: string): Promise<void> {
    await api.delete(`/action-plans/${id}`);
  }

  /**
   * Recalculate plan costs
   */
  async recalculatePlanCosts(id: string): Promise<ActionPlan> {
    const response = await api.post(`/action-plans/${id}/recalculate-costs`);
    return response.data;
  }

  /**
   * Calculate plan progress
   */
  async calculateProgress(id: string): Promise<ActionPlan> {
    const response = await api.post(`/action-plans/${id}/calculate-progress`);
    return response.data;
  }

  /**
   * Validate action plan
   */
  async validateActionPlan(id: string, validatedBy?: string): Promise<ActionPlan> {
    const response = await api.post(`/action-plans/${id}/validate`, { validatedBy });
    return response.data;
  }

  /**
   * Get summary by ministry
   */
  async getSummaryByMinistry(fiscalYear?: number): Promise<ActionPlanSummary[]> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await api.get('/action-plans/summary/ministry', { params });
    return response.data;
  }

  /**
   * Get performance indicators
   */
  async getPerformanceIndicators(id: string): Promise<PerformanceIndicators> {
    const response = await api.get(`/action-plans/${id}/performance-indicators`);
    return response.data;
  }

  /**
   * Duplicate action plan
   */
  async duplicateActionPlan(id: string, newPlanCode: string, createdBy?: string): Promise<ActionPlan> {
    const response = await api.post(`/action-plans/${id}/duplicate`, { newPlanCode, createdBy });
    return response.data;
  }

  // ========== ACTIVITY METHODS ==========

  /**
   * Get all activities for a plan
   */
  async getActivitiesByPlan(planId: string): Promise<ActionPlanActivity[]> {
    const response = await api.get(`/action-plans/${planId}/activities`);
    return response.data;
  }

  /**
   * Get activity by ID
   */
  async getActivity(activityId: string): Promise<ActionPlanActivity> {
    const response = await api.get(`/action-plans/activities/${activityId}`);
    return response.data;
  }

  /**
   * Create a new activity
   */
  async createActivity(planId: string, data: CreateActivityDto): Promise<ActionPlanActivity> {
    const response = await api.post(`/action-plans/${planId}/activities`, data);
    return response.data;
  }

  /**
   * Update an activity
   */
  async updateActivity(activityId: string, data: UpdateActivityDto): Promise<ActionPlanActivity> {
    const response = await api.put(`/action-plans/activities/${activityId}`, data);
    return response.data;
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string): Promise<void> {
    await api.delete(`/action-plans/activities/${activityId}`);
  }

  /**
   * Reorder activities
   */
  async reorderActivities(planId: string, activityOrders: ActivityOrder[]): Promise<ActionPlanActivity[]> {
    const response = await api.post(`/action-plans/${planId}/activities/reorder`, { activityOrders });
    return response.data;
  }

  /**
   * Bulk import activities
   */
  async bulkImportActivities(planId: string, activities: CreateActivityDto[]): Promise<BulkImportResult> {
    const response = await api.post(`/action-plans/${planId}/activities/bulk-import`, { activities });
    return response.data;
  }

  /**
   * Start activity
   */
  async startActivity(activityId: string): Promise<ActionPlanActivity> {
    const response = await api.post(`/action-plans/activities/${activityId}/start`);
    return response.data;
  }

  /**
   * Complete activity
   */
  async completeActivity(activityId: string): Promise<ActionPlanActivity> {
    const response = await api.post(`/action-plans/activities/${activityId}/complete`);
    return response.data;
  }

  /**
   * Update activity progress
   */
  async updateProgress(activityId: string, progress: number): Promise<ActionPlanActivity> {
    const response = await api.post(`/action-plans/activities/${activityId}/progress`, { progress });
    return response.data;
  }

  /**
   * Get activities summary by status
   */
  async getActivitiesSummaryByStatus(planId: string): Promise<ActivitiesSummary> {
    const response = await api.get(`/action-plans/${planId}/activities/summary`);
    return response.data;
  }

  /**
   * Calculate critical path
   */
  async calculateCriticalPath(planId: string): Promise<CriticalPath> {
    const response = await api.get(`/action-plans/${planId}/activities/critical-path`);
    return response.data;
  }

  // =====================================================
  // EXPORT METHODS
  // =====================================================

  /**
   * Export action plan to PDF
   */
  async exportToPdf(id: string): Promise<void> {
    const response = await api.get(`/action-plans/${id}/export/pdf`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plan-action-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Export action plan to Excel
   */
  async exportToExcel(id: string): Promise<void> {
    const response = await api.get(`/action-plans/${id}/export/excel`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plan-action-${id}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Export action plan to CSV
   */
  async exportToCsv(id: string): Promise<void> {
    const response = await api.get(`/action-plans/${id}/export/csv`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plan-action-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export default new ActionPlanService();
