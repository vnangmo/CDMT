import api from '../config/api';
import {
  SectoralTrendProjection,
  CalculateSectoralProjectionsDto,
  CalculationResult,
  ActionSummary,
  ActivitySummary,
  CeilingExceedancesResult,
  CDMTGlobalCeiling,
  IntegratePIEPIPResult,
  SectoralCoherenceValidation,
  SectoralTrendFilters,
} from '../types/sectoralTrend.types';

class SectoralTrendService {
  /**
   * Calculate sectoral projections
   */
  async calculateProjections(
    trendConfigId: string,
    data?: Partial<CalculateSectoralProjectionsDto>
  ): Promise<CalculationResult> {
    const response = await api.post(`/sectoral-trends/${trendConfigId}/calculate`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du calcul des projections sectorielles');
  }

  /**
   * Get summary by Action
   */
  async getSummaryByAction(trendConfigId: string): Promise<ActionSummary[]> {
    const response = await api.get(`/sectoral-trends/${trendConfigId}/summary/action`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé par action');
  }

  /**
   * Get summary by Activity
   */
  async getSummaryByActivity(trendConfigId: string): Promise<ActivitySummary[]> {
    const response = await api.get(`/sectoral-trends/${trendConfigId}/summary/activity`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé par activité');
  }

  /**
   * Check ceiling exceedances
   */
  async checkCeilingExceedances(trendConfigId: string): Promise<CeilingExceedancesResult> {
    const response = await api.get(`/sectoral-trends/${trendConfigId}/ceiling-exceedances`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la vérification des dépassements de plafond');
  }

  /**
   * Get CDMT Global ceilings for a ministry
   */
  async getCDMTGlobalCeilings(ministryId: string, fiscalYear: number): Promise<CDMTGlobalCeiling> {
    const response = await api.get(`/sectoral-trends/ministry/${ministryId}/ceilings`, {
      params: { fiscalYear },
    });
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des plafonds CDMT Global');
  }

  /**
   * Integrate PIE/PIP projects
   */
  async integratePIEPIPProjects(
    trendConfigId: string,
    fiscalYear: number
  ): Promise<IntegratePIEPIPResult> {
    const response = await api.post(
      `/sectoral-trends/${trendConfigId}/integrate-projects`,
      {},
      { params: { fiscalYear } }
    );
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de l\'intégration des projets PIE/PIP');
  }

  /**
   * Validate sectoral coherence
   */
  async validateCoherence(trendConfigId: string): Promise<SectoralCoherenceValidation> {
    const response = await api.get(`/sectoral-trends/${trendConfigId}/validate`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la validation de la cohérence sectorielle');
  }
}

export default new SectoralTrendService();
