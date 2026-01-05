import api from '../config/api';
import {
  MacroFramework,
  CreateMacroFrameworkDto,
  UpdateMacroFrameworkDto,
  RevenueProjection,
  CreateRevenueProjectionDto,
  UpdateRevenueProjectionDto,
  ExpenseProjection,
  CreateExpenseProjectionDto,
  UpdateExpenseProjectionDto,
  ProjectionSummary,
  FiscalBalance,
  CoherenceValidation,
  GlobalStats,
} from '../types/macro.types';

class MacroService {
  // ============================================
  // MACRO FRAMEWORKS
  // ============================================

  async getMacroFrameworks(): Promise<MacroFramework[]> {
    const response = await api.get('/macro-frameworks');
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des cadres macroéconomiques');
  }

  async getMacroFramework(id: string): Promise<MacroFramework> {
    const response = await api.get(`/macro-frameworks/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du cadre macroéconomique');
  }

  async getMacroFrameworkByYear(year: number, budgetYear: number): Promise<MacroFramework> {
    const response = await api.get(`/macro-frameworks/year/${year}/${budgetYear}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du cadre macroéconomique');
  }

  async createMacroFramework(data: CreateMacroFrameworkDto): Promise<MacroFramework> {
    const response = await api.post('/macro-frameworks', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création du cadre macroéconomique');
  }

  async updateMacroFramework(id: string, data: UpdateMacroFrameworkDto): Promise<MacroFramework> {
    const response = await api.put(`/macro-frameworks/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du cadre macroéconomique');
  }

  async deleteMacroFramework(id: string): Promise<void> {
    const response = await api.delete(`/macro-frameworks/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression du cadre macroéconomique');
    }
  }

  async validateMacroFramework(id: string): Promise<MacroFramework> {
    const response = await api.patch(`/macro-frameworks/${id}/validate`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la validation du cadre macroéconomique');
  }

  async approveMacroFramework(id: string): Promise<MacroFramework> {
    const response = await api.patch(`/macro-frameworks/${id}/approve`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de l\'approbation du cadre macroéconomique');
  }

  async rejectMacroFramework(id: string): Promise<MacroFramework> {
    const response = await api.patch(`/macro-frameworks/${id}/reject`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du rejet du cadre macroéconomique');
  }

  async validateCoherence(id: string): Promise<CoherenceValidation> {
    const response = await api.get(`/macro-frameworks/${id}/validate-coherence`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la validation de cohérence');
  }

  async getGlobalStats(id: string): Promise<GlobalStats> {
    const response = await api.get(`/macro-frameworks/${id}/global-stats`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des statistiques');
  }

  // ============================================
  // REVENUE PROJECTIONS
  // ============================================

  async getRevenueProjections(macroFrameworkId?: string): Promise<RevenueProjection[]> {
    const params = macroFrameworkId ? { macroFrameworkId } : {};
    const response = await api.get('/revenue-projections', { params });
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projections de recettes');
  }

  async getRevenueProjection(id: string): Promise<RevenueProjection> {
    const response = await api.get(`/revenue-projections/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de la projection de recettes');
  }

  async getRevenueProjectionsByMacroFramework(macroFrameworkId: string): Promise<RevenueProjection[]> {
    const response = await api.get(`/revenue-projections/macro-framework/${macroFrameworkId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projections de recettes');
  }

  async createRevenueProjection(data: CreateRevenueProjectionDto): Promise<RevenueProjection> {
    const response = await api.post('/revenue-projections', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de la projection de recettes');
  }

  async updateRevenueProjection(id: string, data: UpdateRevenueProjectionDto): Promise<RevenueProjection> {
    const response = await api.put(`/revenue-projections/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de la projection de recettes');
  }

  async deleteRevenueProjection(id: string): Promise<void> {
    const response = await api.delete(`/revenue-projections/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de la projection de recettes');
    }
  }

  async calculateRevenueProjection(id: string): Promise<RevenueProjection> {
    const response = await api.post(`/revenue-projections/${id}/calculate`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du calcul de la projection');
  }

  async recalculateAllRevenues(macroFrameworkId: string): Promise<RevenueProjection[]> {
    const response = await api.post(`/revenue-projections/macro-framework/${macroFrameworkId}/recalculate`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du recalcul des projections');
  }

  async getRevenueSummary(macroFrameworkId: string): Promise<ProjectionSummary> {
    const response = await api.get(`/revenue-projections/macro-framework/${macroFrameworkId}/summary`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé');
  }

  // ============================================
  // EXPENSE PROJECTIONS
  // ============================================

  async getExpenseProjections(macroFrameworkId?: string, ministryId?: string): Promise<ExpenseProjection[]> {
    const params: any = {};
    if (macroFrameworkId) params.macroFrameworkId = macroFrameworkId;
    if (ministryId) params.ministryId = ministryId;

    const response = await api.get('/expense-projections', { params });
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projections de dépenses');
  }

  async getExpenseProjection(id: string): Promise<ExpenseProjection> {
    const response = await api.get(`/expense-projections/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de la projection de dépenses');
  }

  async getExpenseProjectionsByMacroFramework(macroFrameworkId: string): Promise<ExpenseProjection[]> {
    const response = await api.get(`/expense-projections/macro-framework/${macroFrameworkId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projections de dépenses');
  }

  async getExpenseProjectionsByMinistry(macroFrameworkId: string, ministryId: string): Promise<ExpenseProjection[]> {
    const response = await api.get(`/expense-projections/macro-framework/${macroFrameworkId}/ministry/${ministryId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projections de dépenses');
  }

  async createExpenseProjection(data: CreateExpenseProjectionDto): Promise<ExpenseProjection> {
    const response = await api.post('/expense-projections', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de la projection de dépenses');
  }

  async updateExpenseProjection(id: string, data: UpdateExpenseProjectionDto): Promise<ExpenseProjection> {
    const response = await api.put(`/expense-projections/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de la projection de dépenses');
  }

  async deleteExpenseProjection(id: string): Promise<void> {
    const response = await api.delete(`/expense-projections/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de la projection de dépenses');
    }
  }

  async calculateExpenseProjection(id: string): Promise<ExpenseProjection> {
    const response = await api.post(`/expense-projections/${id}/calculate`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du calcul de la projection');
  }

  async getExpenseSummary(macroFrameworkId: string): Promise<ProjectionSummary> {
    const response = await api.get(`/expense-projections/macro-framework/${macroFrameworkId}/summary`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé');
  }

  async getFiscalBalance(macroFrameworkId: string): Promise<FiscalBalance> {
    const response = await api.get(`/expense-projections/macro-framework/${macroFrameworkId}/fiscal-balance`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du solde budgétaire');
  }
}

const macroService = new MacroService();
export default macroService;
