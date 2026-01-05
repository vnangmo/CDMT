import apiClient from './api.service';
import {
  CDMTGlobalScenario,
  CreateCDMTGlobalScenarioDto,
  UpdateCDMTGlobalScenarioDto,
  PolicyMeasure,
  CreatePolicyMeasureDto,
  UpdatePolicyMeasureDto,
  MarginAllocation,
  UpdateMarginAllocationDto,
  BulkMarginAllocationDto,
  MinisterialCeiling,
  ScenarioListResponse,
  ScenarioSummary,
  MarginValidationResult,
  RemainingMarginResponse,
  CalculationResult,
  BulkImportResult,
  BulkUpdateResult,
  ScenarioComparison,
  ScenarioDifferences,
  CBMTSyncResult,
  CBMTCreationResult,
  CBMTCoherenceValidation,
  ComparisonReport,
  ScenarioFilters,
  PolicyMeasureFilters,
  CeilingFilters,
} from '../types/cdmtGlobal.types';

const BASE_URL = '/cdmt-global';

export class CDMTGlobalService {
  // ===== SCENARIOS =====

  static async getScenarios(filters?: ScenarioFilters): Promise<ScenarioListResponse> {
    const params = new URLSearchParams();
    if (filters?.fiscalYear) params.append('fiscalYear', filters.fiscalYear.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`${BASE_URL}/scenarios?${params.toString()}`);
    return response.data.data;
  }

  static async getScenarioById(id: string): Promise<CDMTGlobalScenario> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${id}`);
    return response.data.data;
  }

  static async createScenario(data: CreateCDMTGlobalScenarioDto): Promise<CDMTGlobalScenario> {
    const response = await apiClient.post(`${BASE_URL}/scenarios`, data);
    return response.data.data;
  }

  static async updateScenario(
    id: string,
    data: UpdateCDMTGlobalScenarioDto
  ): Promise<CDMTGlobalScenario> {
    const response = await apiClient.put(`${BASE_URL}/scenarios/${id}`, data);
    return response.data.data;
  }

  static async deleteScenario(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/scenarios/${id}`);
  }

  static async duplicateScenario(
    id: string,
    name: string,
    code: string
  ): Promise<CDMTGlobalScenario> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${id}/duplicate`, { name, code });
    return response.data.data;
  }

  static async activateScenario(id: string): Promise<CDMTGlobalScenario> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${id}/activate`);
    return response.data.data;
  }

  static async deactivateScenario(id: string): Promise<CDMTGlobalScenario> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${id}/deactivate`);
    return response.data.data;
  }

  static async archiveScenario(id: string): Promise<CDMTGlobalScenario> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${id}/archive`);
    return response.data.data;
  }

  // ===== POLICY MEASURES =====

  static async getPolicyMeasures(
    scenarioId: string,
    filters?: PolicyMeasureFilters
  ): Promise<PolicyMeasure[]> {
    const params = new URLSearchParams();
    if (filters?.ministryId) params.append('ministryId', filters.ministryId);

    const response = await apiClient.get(
      `${BASE_URL}/scenarios/${scenarioId}/measures?${params.toString()}`
    );
    return response.data.data;
  }

  static async createPolicyMeasure(
    scenarioId: string,
    data: CreatePolicyMeasureDto
  ): Promise<PolicyMeasure> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${scenarioId}/measures`, data);
    return response.data.data;
  }

  static async updatePolicyMeasure(
    id: string,
    data: UpdatePolicyMeasureDto
  ): Promise<PolicyMeasure> {
    const response = await apiClient.put(`${BASE_URL}/measures/${id}`, data);
    return response.data.data;
  }

  static async deletePolicyMeasure(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/measures/${id}`);
  }

  static async bulkImportPolicyMeasures(
    scenarioId: string,
    measures: CreatePolicyMeasureDto[]
  ): Promise<BulkImportResult> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${scenarioId}/measures/bulk`, {
      measures,
    });
    return response.data.data;
  }

  // ===== MARGIN ALLOCATION =====

  static async getMarginAllocations(scenarioId: string): Promise<MarginAllocation[]> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${scenarioId}/allocations`);
    return response.data.data;
  }

  static async updateMarginAllocation(
    scenarioId: string,
    ministryId: string,
    data: UpdateMarginAllocationDto
  ): Promise<MarginAllocation> {
    const response = await apiClient.put(
      `${BASE_URL}/scenarios/${scenarioId}/allocations/${ministryId}`,
      data
    );
    return response.data.data;
  }

  static async bulkUpdateMarginAllocations(
    scenarioId: string,
    allocations: BulkMarginAllocationDto[]
  ): Promise<BulkUpdateResult> {
    const response = await apiClient.post(
      `${BASE_URL}/scenarios/${scenarioId}/allocations/bulk`,
      { allocations }
    );
    return response.data.data;
  }

  static async resetMarginAllocations(scenarioId: string): Promise<{ message: string }> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${scenarioId}/allocations/reset`);
    return response.data.data;
  }

  static async getRemainingMargin(scenarioId: string): Promise<RemainingMarginResponse> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${scenarioId}/margin-remaining`);
    return response.data.data;
  }

  // ===== MINISTERIAL CEILINGS =====

  static async getMinisterialCeilings(
    scenarioId: string,
    filters?: CeilingFilters
  ): Promise<MinisterialCeiling[]> {
    const params = new URLSearchParams();
    if (filters?.ministryId) params.append('ministryId', filters.ministryId);
    if (filters?.year) params.append('year', filters.year.toString());

    const response = await apiClient.get(
      `${BASE_URL}/scenarios/${scenarioId}/ceilings?${params.toString()}`
    );
    return response.data.data;
  }

  static async getMinisterialCeilingByMinistry(
    scenarioId: string,
    ministryId: string
  ): Promise<MinisterialCeiling[]> {
    const response = await apiClient.get(
      `${BASE_URL}/scenarios/${scenarioId}/ceilings/${ministryId}`
    );
    return response.data.data;
  }

  static async recalculateCeilings(scenarioId: string): Promise<CalculationResult> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${scenarioId}/calculate`);
    return response.data.data;
  }

  static async validateAllocations(scenarioId: string): Promise<MarginValidationResult> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${scenarioId}/validate`);
    return response.data.data;
  }

  // ===== COMPARISON =====

  static async compareScenarios(scenarioIds: string[]): Promise<ScenarioComparison> {
    const response = await apiClient.post(`${BASE_URL}/compare`, { scenarioIds });
    return response.data.data;
  }

  static async getScenarioDifferences(id1: string, id2: string): Promise<ScenarioDifferences> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${id1}/diff/${id2}`);
    return response.data.data;
  }

  // ===== CBMT INTEGRATION =====

  static async syncCBMT(scenarioId: string): Promise<CBMTSyncResult> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${scenarioId}/sync-cbmt`);
    return response.data.data;
  }

  static async createCBMT(
    scenarioId: string,
    data?: { title?: string; description?: string }
  ): Promise<CBMTCreationResult> {
    const response = await apiClient.post(`${BASE_URL}/scenarios/${scenarioId}/create-cbmt`, data);
    return response.data.data;
  }

  static async validateCBMTCoherence(
    scenarioId: string,
    cbmtId: string
  ): Promise<CBMTCoherenceValidation> {
    const response = await apiClient.get(
      `${BASE_URL}/scenarios/${scenarioId}/cbmt-coherence/${cbmtId}`
    );
    return response.data.data;
  }

  // ===== EXPORTS =====

  static async exportExcel(scenarioId: string): Promise<Blob> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${scenarioId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  }

  static async exportCSV(scenarioId: string): Promise<Blob> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${scenarioId}/export/csv`, {
      responseType: 'blob',
    });
    return response.data;
  }

  static async exportPDF(scenarioId: string): Promise<Blob> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${scenarioId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  static async getComparisonReport(scenarioId: string): Promise<ComparisonReport> {
    const response = await apiClient.get(`${BASE_URL}/scenarios/${scenarioId}/comparison-report`);
    return response.data.data;
  }

  // ===== HELPER METHODS =====

  static downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default CDMTGlobalService;
