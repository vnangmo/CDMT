import api from '../config/api';
import {
  SectoralMeasure,
  CreateSectoralMeasureDto,
  UpdateSectoralMeasureDto,
  SectoralMeasureFilters,
  SectoralMeasureSummary,
  CeilingValidation,
  AvailableMargin,
  IntegrationResult,
  IntegrationStatus,
  IntegrationPreview,
  CostBreakdown,
  ValidationReport,
} from '../types/sectoralMeasure.types';

class SectoralMeasureService {
  /**
   * Get all sectoral measures with optional filters
   */
  async getSectoralMeasures(filters?: SectoralMeasureFilters): Promise<SectoralMeasure[]> {
    const response = await api.get('/sectoral-measures', { params: filters });
    return response.data;
  }

  /**
   * Get a single sectoral measure by ID
   */
  async getSectoralMeasure(id: string): Promise<SectoralMeasure> {
    const response = await api.get(`/sectoral-measures/${id}`);
    return response.data;
  }

  /**
   * Create a new sectoral measure
   */
  async createSectoralMeasure(data: CreateSectoralMeasureDto): Promise<SectoralMeasure> {
    const response = await api.post('/sectoral-measures', data);
    return response.data;
  }

  /**
   * Update an existing sectoral measure
   */
  async updateSectoralMeasure(id: string, data: UpdateSectoralMeasureDto): Promise<SectoralMeasure> {
    const response = await api.put(`/sectoral-measures/${id}`, data);
    return response.data;
  }

  /**
   * Delete a sectoral measure
   */
  async deleteSectoralMeasure(id: string): Promise<void> {
    await api.delete(`/sectoral-measures/${id}`);
  }

  /**
   * Submit measure for validation
   */
  async submitForValidation(id: string, submittedBy?: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/submit`, { submittedBy });
    return response.data;
  }

  /**
   * Validate measure
   */
  async validateMeasure(id: string, validatedBy?: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/validate`, { validatedBy });
    return response.data;
  }

  /**
   * Reject measure
   */
  async rejectMeasure(id: string, rejectionReason: string, validatedBy?: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/reject`, { rejectionReason, validatedBy });
    return response.data;
  }

  /**
   * Get summary by ministry
   */
  async getSummaryByMinistry(fiscalYear?: number): Promise<SectoralMeasureSummary[]> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await api.get('/sectoral-measures/summary/ministry', { params });
    return response.data;
  }

  /**
   * Get summary by category
   */
  async getSummaryByCategory(fiscalYear?: number): Promise<SectoralMeasureSummary[]> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await api.get('/sectoral-measures/summary/category', { params });
    return response.data;
  }

  /**
   * Get summary by action
   */
  async getSummaryByAction(ministryId?: string, fiscalYear?: number): Promise<SectoralMeasureSummary[]> {
    const params: any = {};
    if (ministryId) params.ministryId = ministryId;
    if (fiscalYear) params.fiscalYear = fiscalYear;
    const response = await api.get('/sectoral-measures/summary/action', { params });
    return response.data;
  }

  /**
   * Get summary by activity
   */
  async getSummaryByActivity(ministryId?: string, fiscalYear?: number): Promise<SectoralMeasureSummary[]> {
    const params: any = {};
    if (ministryId) params.ministryId = ministryId;
    if (fiscalYear) params.fiscalYear = fiscalYear;
    const response = await api.get('/sectoral-measures/summary/activity', { params });
    return response.data;
  }

  /**
   * Recalculate measure costs
   */
  async recalculateCosts(id: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/recalculate-costs`);
    return response.data;
  }

  /**
   * Get ministry aggregated costs
   */
  async getMinistryAggregatedCosts(ministryId: string, fiscalYear: number): Promise<any> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/aggregated-costs`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Get cost breakdown by economic nature
   */
  async getCostBreakdownByEconomicNature(ministryId: string, fiscalYear: number): Promise<CostBreakdown> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/breakdown/economic-nature`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Get cost breakdown by funding source
   */
  async getCostBreakdownByFundingSource(ministryId: string, fiscalYear: number): Promise<CostBreakdown> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/breakdown/funding-source`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Get comprehensive cost report
   */
  async getComprehensiveCostReport(ministryId: string, fiscalYear: number): Promise<any> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/cost-report`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Validate ministry ceiling
   */
  async validateMinisteryCeiling(ministryId: string, fiscalYear: number): Promise<CeilingValidation> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/validate-ceiling`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Check all ministry ceilings
   */
  async checkAllMinisteryCeilings(fiscalYear: number): Promise<CeilingValidation> {
    const response = await api.get('/sectoral-measures/validate-all-ceilings', {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Calculate available margin
   */
  async calculateAvailableMargin(ministryId: string, fiscalYear: number): Promise<AvailableMargin> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/available-margin`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Generate validation report
   */
  async generateValidationReport(ministryId: string, fiscalYear: number): Promise<ValidationReport> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/validation-report`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Integrate ministry measures
   */
  async integrateMinistryMeasures(
    ministryId: string,
    fiscalYear: number,
    integratedBy?: string
  ): Promise<IntegrationResult> {
    const response = await api.post(`/sectoral-measures/ministry/${ministryId}/integrate`, {
      fiscalYear,
      integratedBy,
    });
    return response.data;
  }

  /**
   * Rollback integration
   */
  async rollbackIntegration(ministryId: string, fiscalYear: number): Promise<any> {
    const response = await api.post(`/sectoral-measures/ministry/${ministryId}/rollback`, {
      fiscalYear,
    });
    return response.data;
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(ministryId: string, fiscalYear: number): Promise<IntegrationStatus> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/integration-status`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Preview integration
   */
  async previewIntegration(ministryId: string, fiscalYear: number): Promise<IntegrationPreview> {
    const response = await api.get(`/sectoral-measures/ministry/${ministryId}/preview-integration`, {
      params: { fiscalYear },
    });
    return response.data;
  }

  /**
   * Integrate all ministries
   */
  async integrateAllMinistries(fiscalYear: number, integratedBy?: string): Promise<any> {
    const response = await api.post('/sectoral-measures/integrate-all', {
      fiscalYear,
      integratedBy,
    });
    return response.data;
  }

  // =====================================================
  // WORKFLOW METHODS (5-Level Workflow)
  // =====================================================

  /**
   * Submit measure for review
   */
  async submit(id: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/submit`);
    return response.data.data;
  }

  /**
   * Start review of measure
   */
  async startReview(id: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/start-review`);
    return response.data.data;
  }

  /**
   * Validate measure
   */
  async validate(id: string, comment?: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/validate`, { comment });
    return response.data.data;
  }

  /**
   * Approve measure
   */
  async approve(id: string, comment?: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/approve`, { comment });
    return response.data.data;
  }

  /**
   * Reject measure
   */
  async reject(id: string, reason: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/reject`, { reason });
    return response.data.data;
  }

  /**
   * Return measure to draft
   */
  async returnToDraft(id: string, comment?: string): Promise<SectoralMeasure> {
    const response = await api.post(`/sectoral-measures/${id}/return-to-draft`, { comment });
    return response.data.data;
  }

  // =====================================================
  // EXPORT METHODS
  // =====================================================

  /**
   * Export sectoral measure to PDF
   */
  async exportToPdf(id: string): Promise<void> {
    const response = await api.get(`/sectoral-measures/${id}/export/pdf`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mesure-sectorielle-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Export sectoral measure to Excel
   */
  async exportToExcel(id: string): Promise<void> {
    const response = await api.get(`/sectoral-measures/${id}/export/excel`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mesure-sectorielle-${id}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Export sectoral measure to CSV
   */
  async exportToCsv(id: string): Promise<void> {
    const response = await api.get(`/sectoral-measures/${id}/export/csv`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mesure-sectorielle-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export default new SectoralMeasureService();
