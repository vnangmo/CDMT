import api from '../config/api';
import {
  WorkflowHistory,
  WorkflowStats,
  PendingReview,
} from '../types/workflow.types';

class WorkflowService {
  /**
   * Get workflow history for a document
   */
  async getHistory(
    documentType: string,
    documentId: string
  ): Promise<WorkflowHistory[]> {
    const response = await api.get(
      `/workflow/history/${documentType}/${documentId}`
    );
    return response.data.data;
  }

  /**
   * Get pending reviews for current user
   */
  async getPendingReviews(): Promise<PendingReview[]> {
    const response = await api.get('/workflow/pending-reviews');
    return response.data.data;
  }

  /**
   * Get workflow statistics
   */
  async getStats(filters?: {
    documentType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WorkflowStats> {
    const params = new URLSearchParams();
    if (filters?.documentType) params.append('documentType', filters.documentType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/workflow/stats?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Check if document can be edited
   */
  async canEdit(documentType: string, documentId: string): Promise<boolean> {
    const response = await api.get(
      `/workflow/can-edit/${documentType}/${documentId}`
    );
    return response.data.data.canEdit;
  }

  /**
   * Check if document is in final state
   */
  async isFinal(documentType: string, documentId: string): Promise<boolean> {
    const response = await api.get(
      `/workflow/is-final/${documentType}/${documentId}`
    );
    return response.data.data.isFinal;
  }
}

export default new WorkflowService();
