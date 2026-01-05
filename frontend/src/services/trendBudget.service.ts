import axios from 'axios';
import {
  TrendBudgetConfig,
  CreateTrendBudgetConfigDto,
  UpdateTrendBudgetConfigDto,
  HistoricalBudget,
  CreateHistoricalBudgetDto,
  UpdateHistoricalBudgetDto,
  TrendProjection,
  UpdateTrendProjectionDto,
  TrendSummaryByMinistry,
  TrendSummaryByPriority,
  CoherenceValidation,
  ComparisonReport,
  TrendBudgetConfigFilters,
  HistoricalBudgetFilters,
  TrendProjectionFilters,
  PaginatedResponse,
  ImportResult,
  CalculationResult,
} from '../types/trendBudget.types';

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

class TrendBudgetService {
  // ===== TREND BUDGET CONFIG =====

  async getTrendBudgetConfigs(
    filters?: TrendBudgetConfigFilters
  ): Promise<PaginatedResponse<TrendBudgetConfig>> {
    const response = await api.get('/trend-budgets', { params: filters });
    return response.data.data;
  }

  async getTrendBudgetConfig(id: string): Promise<TrendBudgetConfig> {
    const response = await api.get(`/trend-budgets/${id}`);
    return response.data.data;
  }

  async createTrendBudgetConfig(data: CreateTrendBudgetConfigDto): Promise<TrendBudgetConfig> {
    const response = await api.post('/trend-budgets', data);
    return response.data.data;
  }

  async updateTrendBudgetConfig(
    id: string,
    data: UpdateTrendBudgetConfigDto
  ): Promise<TrendBudgetConfig> {
    const response = await api.put(`/trend-budgets/${id}`, data);
    return response.data.data;
  }

  async deleteTrendBudgetConfig(id: string): Promise<void> {
    await api.delete(`/trend-budgets/${id}`);
  }

  async validateTrendBudgetConfig(id: string): Promise<TrendBudgetConfig> {
    const response = await api.post(`/trend-budgets/${id}/validate`);
    return response.data.data;
  }

  async approveTrendBudgetConfig(id: string): Promise<TrendBudgetConfig> {
    const response = await api.post(`/trend-budgets/${id}/approve`);
    return response.data.data;
  }

  // ===== HISTORICAL BUDGETS =====

  async getHistoricalBudgets(
    configId: string,
    filters?: HistoricalBudgetFilters
  ): Promise<PaginatedResponse<HistoricalBudget>> {
    const response = await api.get(`/trend-budgets/${configId}/historical`, { params: filters });
    return response.data.data;
  }

  async createHistoricalBudget(data: CreateHistoricalBudgetDto): Promise<HistoricalBudget> {
    const response = await api.post('/trend-budgets/historical', data);
    return response.data.data;
  }

  async updateHistoricalBudget(
    id: string,
    data: UpdateHistoricalBudgetDto
  ): Promise<HistoricalBudget> {
    const response = await api.put(`/trend-budgets/historical/${id}`, data);
    return response.data.data;
  }

  async deleteHistoricalBudget(id: string): Promise<void> {
    await api.delete(`/trend-budgets/historical/${id}`);
  }

  async toggleTemporary(id: string): Promise<HistoricalBudget> {
    const response = await api.post(`/trend-budgets/historical/${id}/toggle-temporary`);
    return response.data.data;
  }

  // ===== IMPORT =====

  async downloadTemplate(): Promise<Blob> {
    const response = await api.get('/trend-budgets/import/template', {
      responseType: 'blob',
    });
    return response.data;
  }

  async importExcel(configId: string, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/trend-budgets/${configId}/import/excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async importCSV(configId: string, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/trend-budgets/${configId}/import/csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // ===== PROJECTIONS =====

  async getTrendProjections(
    configId: string,
    filters?: TrendProjectionFilters
  ): Promise<PaginatedResponse<TrendProjection>> {
    const response = await api.get(`/trend-budgets/${configId}/projections`, { params: filters });
    return response.data.data;
  }

  async getTrendProjection(id: string): Promise<TrendProjection> {
    const response = await api.get(`/trend-budgets/projection/${id}`);
    return response.data.data;
  }

  async updateTrendProjection(
    id: string,
    data: UpdateTrendProjectionDto
  ): Promise<TrendProjection> {
    const response = await api.put(`/trend-budgets/projection/${id}`, data);
    return response.data.data;
  }

  async calculateProjections(configId: string): Promise<CalculationResult> {
    const response = await api.post(`/trend-budgets/${configId}/calculate`);
    return response.data.data;
  }

  async recalculateProjection(id: string): Promise<TrendProjection> {
    const response = await api.post(`/trend-budgets/projection/${id}/recalculate`);
    return response.data.data;
  }

  // ===== SUMMARIES =====

  async getSummaryByMinistry(configId: string): Promise<TrendSummaryByMinistry[]> {
    const response = await api.get(`/trend-budgets/${configId}/summary/ministry`);
    return response.data.data;
  }

  async getSummaryByPriority(configId: string): Promise<TrendSummaryByPriority[]> {
    const response = await api.get(`/trend-budgets/${configId}/summary/priority`);
    return response.data.data;
  }

  async validateCoherence(configId: string): Promise<CoherenceValidation> {
    const response = await api.get(`/trend-budgets/${configId}/validate-coherence`);
    return response.data.data;
  }

  // ===== EXPORTS =====

  async exportExcel(configId: string): Promise<Blob> {
    const response = await api.get(`/trend-budgets/${configId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportCSV(configId: string): Promise<Blob> {
    const response = await api.get(`/trend-budgets/${configId}/export/csv`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportPDF(configId: string): Promise<Blob> {
    const response = await api.get(`/trend-budgets/${configId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getComparisonReport(configId: string): Promise<ComparisonReport> {
    const response = await api.get(`/trend-budgets/${configId}/comparison-report`);
    return response.data.data;
  }
}

export default new TrendBudgetService();
