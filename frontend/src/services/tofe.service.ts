import api from '../config/api';
import {
  TOFEDocument,
  CreateTOFEDocumentDto,
  UpdateTOFEDocumentDto,
  TOFELine,
  CreateTOFELineDto,
  FiscalBalance,
  ConsistencyCheck,
  BudgetRatio,
  TOFESummary,
  TOFEFilters,
} from '../types/tofe.types';

class TOFEService {
  // ============================================
  // TOFE DOCUMENTS
  // ============================================

  async getTOFEDocuments(filters?: TOFEFilters): Promise<TOFEDocument[]> {
    const params = new URLSearchParams();
    if (filters?.macroFrameworkId) params.append('macroFrameworkId', filters.macroFrameworkId);
    if (filters?.fiscalYear) params.append('fiscalYear', filters.fiscalYear.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/tofe?${params.toString()}`);
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des documents TOFE');
  }

  async getTOFEDocument(id: string): Promise<TOFEDocument> {
    const response = await api.get(`/tofe/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du document TOFE');
  }

  async getTOFEByMacroFrameworkAndYear(macroFrameworkId: string, fiscalYear: number): Promise<TOFEDocument | null> {
    const response = await api.get(`/tofe/macro/${macroFrameworkId}/year/${fiscalYear}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    return null;
  }

  async createTOFEDocument(data: CreateTOFEDocumentDto): Promise<TOFEDocument> {
    const response = await api.post('/tofe', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création du document TOFE');
  }

  async generateTOFE(macroFrameworkId: string): Promise<TOFEDocument> {
    const response = await api.post(`/tofe/generate/${macroFrameworkId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la génération du document TOFE');
  }

  async updateTOFEDocument(id: string, data: UpdateTOFEDocumentDto): Promise<TOFEDocument> {
    const response = await api.put(`/tofe/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du document TOFE');
  }

  async validateTOFEDocument(id: string): Promise<TOFEDocument> {
    const response = await api.patch(`/tofe/${id}/validate`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la validation du document TOFE');
  }

  async approveTOFEDocument(id: string): Promise<TOFEDocument> {
    const response = await api.patch(`/tofe/${id}/approve`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de l\'approbation du document TOFE');
  }

  async deleteTOFEDocument(id: string): Promise<void> {
    const response = await api.delete(`/tofe/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression du document TOFE');
    }
  }

  // ============================================
  // TOFE LINES
  // ============================================

  async getTOFELines(tofeDocumentId: string): Promise<TOFELine[]> {
    const response = await api.get(`/tofe/${tofeDocumentId}/lines`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des lignes TOFE');
  }

  async createTOFELine(tofeDocumentId: string, data: CreateTOFELineDto): Promise<TOFELine> {
    const response = await api.post(`/tofe/${tofeDocumentId}/lines`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de la ligne TOFE');
  }

  async updateTOFELine(tofeDocumentId: string, lineId: string, data: Partial<CreateTOFELineDto>): Promise<TOFELine> {
    const response = await api.put(`/tofe/${tofeDocumentId}/lines/${lineId}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de la ligne TOFE');
  }

  async deleteTOFELine(tofeDocumentId: string, lineId: string): Promise<void> {
    const response = await api.delete(`/tofe/${tofeDocumentId}/lines/${lineId}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de la ligne TOFE');
    }
  }

  async recalculateTOFE(tofeDocumentId: string): Promise<void> {
    const response = await api.post(`/tofe/${tofeDocumentId}/recalculate`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors du recalcul du TOFE');
    }
  }

  // ============================================
  // CALCULATIONS & ANALYSIS
  // ============================================

  async getFiscalBalance(tofeDocumentId: string): Promise<FiscalBalance[]> {
    const response = await api.get(`/tofe/${tofeDocumentId}/fiscal-balance`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du calcul du solde budgétaire');
  }

  async checkConsistency(tofeDocumentId: string): Promise<ConsistencyCheck> {
    const response = await api.get(`/tofe/${tofeDocumentId}/consistency`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la vérification de cohérence');
  }

  async getBudgetRatios(tofeDocumentId: string): Promise<BudgetRatio[]> {
    const response = await api.get(`/tofe/${tofeDocumentId}/ratios`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du calcul des ratios budgétaires');
  }

  async getTOFESummary(tofeDocumentId: string): Promise<TOFESummary> {
    const response = await api.get(`/tofe/${tofeDocumentId}/summary`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé TOFE');
  }

  // ============================================
  // EXPORT
  // ============================================

  async exportToExcel(tofeDocumentId: string): Promise<Blob> {
    const response = await api.get(`/tofe/${tofeDocumentId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportToPDF(tofeDocumentId: string): Promise<Blob> {
    const response = await api.get(`/tofe/${tofeDocumentId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Helper method to download a blob
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

export default new TOFEService();
