import axios from 'axios';
import {
  CBMTDocument,
  CBMTAggregate,
  CBMTReserve,
  CBMTAnalysis,
  CreateCBMTDocumentDto,
  UpdateCBMTDocumentDto,
  CreateCBMTAggregateDto,
  CreateCBMTReserveDto,
  GapAnalysisResult,
  BudgetSummary,
  SensitivityAnalysisParams,
  SensitivityResult,
  ShockSimulationParams,
  ShockSimulationResult,
  SustainabilityRatios,
  OverrunAlert,
} from '../types/cbmt.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class CBMTService {
  // ===== DOCUMENTS CBMT =====

  async getCBMTDocuments(params?: {
    macroFrameworkId?: string;
    fiscalYear?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: CBMTDocument[]; pagination: any }> {
    const response = await api.get('/cbmt', { params });
    return response.data.data;
  }

  async getCBMTDocument(id: string): Promise<CBMTDocument> {
    const response = await api.get(`/cbmt/${id}`);
    return response.data.data;
  }

  async getCBMTByMacroFrameworkAndYear(
    macroFrameworkId: string,
    fiscalYear: number
  ): Promise<CBMTDocument | null> {
    const response = await api.get(`/cbmt/macro/${macroFrameworkId}/year/${fiscalYear}`);
    return response.data.data;
  }

  async createCBMTDocument(data: CreateCBMTDocumentDto): Promise<CBMTDocument> {
    const response = await api.post('/cbmt', data);
    return response.data.data;
  }

  async updateCBMTDocument(id: string, data: UpdateCBMTDocumentDto): Promise<CBMTDocument> {
    const response = await api.put(`/cbmt/${id}`, data);
    return response.data.data;
  }

  async deleteCBMTDocument(id: string): Promise<void> {
    await api.delete(`/cbmt/${id}`);
  }

  async validateCBMTDocument(id: string): Promise<CBMTDocument> {
    const response = await api.post(`/cbmt/${id}/validate`);
    return response.data.data;
  }

  async approveCBMTDocument(id: string): Promise<CBMTDocument> {
    const response = await api.post(`/cbmt/${id}/approve`);
    return response.data.data;
  }

  async generateCBMTFromTOFE(macroFrameworkId: string): Promise<CBMTDocument> {
    const response = await api.post(`/cbmt/generate/macro/${macroFrameworkId}`);
    return response.data.data;
  }

  // ===== AGRÉGATS =====

  async getAggregates(
    cbmtDocumentId: string,
    params?: { aggregateType?: string; economicNatureId?: string }
  ): Promise<CBMTAggregate[]> {
    const response = await api.get(`/cbmt/${cbmtDocumentId}/aggregates`, { params });
    return response.data.data;
  }

  async createAggregate(data: CreateCBMTAggregateDto): Promise<CBMTAggregate> {
    const response = await api.post('/cbmt/aggregates', data);
    return response.data.data;
  }

  async updateAggregate(
    id: string,
    data: Partial<CreateCBMTAggregateDto>
  ): Promise<CBMTAggregate> {
    const response = await api.put(`/cbmt/aggregates/${id}`, data);
    return response.data.data;
  }

  async deleteAggregate(id: string): Promise<void> {
    await api.delete(`/cbmt/aggregates/${id}`);
  }

  // ===== RÉSERVES =====

  async getReserves(cbmtDocumentId: string): Promise<CBMTReserve[]> {
    const response = await api.get(`/cbmt/${cbmtDocumentId}/reserves`);
    return response.data.data;
  }

  async createReserve(data: CreateCBMTReserveDto): Promise<CBMTReserve> {
    const response = await api.post('/cbmt/reserves', data);
    return response.data.data;
  }

  async updateReserve(id: string, data: Partial<CreateCBMTReserveDto>): Promise<CBMTReserve> {
    const response = await api.put(`/cbmt/reserves/${id}`, data);
    return response.data.data;
  }

  async deleteReserve(id: string): Promise<void> {
    await api.delete(`/cbmt/reserves/${id}`);
  }

  async allocateReserve(id: string, year: number, amount: number): Promise<void> {
    await api.post(`/cbmt/reserves/${id}/allocate`, { year, amount });
  }

  // ===== CALCULS =====

  async recalculateGaps(cbmtDocumentId: string): Promise<void> {
    await api.post(`/cbmt/${cbmtDocumentId}/calculations/recalculate-gaps`);
  }

  async analyzeGaps(cbmtDocumentId: string): Promise<GapAnalysisResult[]> {
    const response = await api.get(`/cbmt/${cbmtDocumentId}/calculations/analyze-gaps`);
    return response.data.data;
  }

  async getBudgetSummary(cbmtDocumentId: string): Promise<BudgetSummary[]> {
    const response = await api.get(`/cbmt/${cbmtDocumentId}/calculations/budget-summary`);
    return response.data.data;
  }

  async calculateSpendingCeilings(cbmtDocumentId: string): Promise<void> {
    await api.post(`/cbmt/${cbmtDocumentId}/calculations/spending-ceilings`);
  }

  async detectOverruns(cbmtDocumentId: string): Promise<OverrunAlert[]> {
    const response = await api.get(`/cbmt/${cbmtDocumentId}/calculations/detect-overruns`);
    return response.data.data;
  }

  // ===== ANALYSES =====

  async getAnalyses(
    cbmtDocumentId: string,
    analysisType?: string
  ): Promise<CBMTAnalysis[]> {
    const params = analysisType ? { analysisType } : undefined;
    const response = await api.get(`/cbmt/${cbmtDocumentId}/analyses`, { params });
    return response.data.data;
  }

  async getAnalysisById(id: string): Promise<CBMTAnalysis> {
    const response = await api.get(`/cbmt/analyses/${id}`);
    return response.data.data;
  }

  async runSensitivityAnalysis(
    cbmtDocumentId: string,
    params: SensitivityAnalysisParams
  ): Promise<SensitivityResult[]> {
    const response = await api.post(`/cbmt/${cbmtDocumentId}/analyses/sensitivity`, params);
    return response.data.data;
  }

  async runShockSimulation(
    cbmtDocumentId: string,
    params: ShockSimulationParams
  ): Promise<ShockSimulationResult> {
    const response = await api.post(`/cbmt/${cbmtDocumentId}/analyses/shock`, params);
    return response.data.data;
  }

  async calculateSustainabilityRatios(
    cbmtDocumentId: string,
    gdpProjections: number[]
  ): Promise<SustainabilityRatios[]> {
    const response = await api.post(`/cbmt/${cbmtDocumentId}/analyses/sustainability`, {
      gdpProjections,
    });
    return response.data.data;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await api.delete(`/cbmt/analyses/${id}`);
  }

  // ===== EXPORTS =====

  async exportToExcel(cbmtDocumentId: string): Promise<Blob> {
    const response = await api.get(`/cbmt/${cbmtDocumentId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportToPDF(cbmtDocumentId: string): Promise<Blob> {
    const response = await api.get(`/cbmt/${cbmtDocumentId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Utilitaire pour télécharger un blob
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new CBMTService();
