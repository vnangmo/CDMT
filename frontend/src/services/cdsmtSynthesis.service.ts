import apiClient from './api.service';
import {
  MinistrySDMTSummary,
  CDSMTValidation,
  NationalSynthesis,
} from '../types/cdsmtSynthesis.types';

const BASE_URL = '/cdsmt-synthesis';

export class CDSMTSynthesisService {
  /**
   * Générer la synthèse CDSMT pour un ministère (Maquette CDSMT - Figure 10)
   */
  static async getMinistrySDMT(
    ministryId: string,
    fiscalYear: number
  ): Promise<MinistrySDMTSummary> {
    const response = await apiClient.get(
      `${BASE_URL}/ministry/${ministryId}?fiscalYear=${fiscalYear}`
    );
    return response.data.data;
  }

  /**
   * Valider le CDSMT par rapport au plafond CDMT Global
   */
  static async validateMinistrySDMT(
    ministryId: string,
    fiscalYear: number
  ): Promise<CDSMTValidation> {
    const response = await apiClient.get(
      `${BASE_URL}/ministry/${ministryId}/validate?fiscalYear=${fiscalYear}`
    );
    return response.data.data;
  }

  /**
   * Générer la synthèse nationale (tous les ministères)
   */
  static async getNationalSynthesis(fiscalYear: number): Promise<NationalSynthesis> {
    const response = await apiClient.get(`${BASE_URL}/national?fiscalYear=${fiscalYear}`);
    const data = response.data.data;

    // Transform API response to match frontend types
    const ministries = data.byMinistry || [];
    const conformantMinistries = ministries.filter((m: any) => m.respectsCeilingY1 && m.respectsCeilingY2 && m.respectsCeilingY3).length;

    return {
      fiscalYear: data.fiscalYear,
      generatedAt: new Date().toISOString(),
      totalCeilings: {
        y1: data.totalCeilingY1 || 0,
        y2: data.totalCeilingY2 || 0,
        y3: data.totalCeilingY3 || 0,
      },
      totalTendanciel: {
        y1: ministries.reduce((sum: number, m: any) => sum + (m.totalTendancielY1 || 0), 0),
        y2: ministries.reduce((sum: number, m: any) => sum + (m.totalTendancielY2 || 0), 0),
        y3: ministries.reduce((sum: number, m: any) => sum + (m.totalTendancielY3 || 0), 0),
      },
      totalMesuresNouvelles: {
        y1: ministries.reduce((sum: number, m: any) => sum + (m.totalMesuresNouvellesY1 || 0), 0),
        y2: ministries.reduce((sum: number, m: any) => sum + (m.totalMesuresNouvellesY2 || 0), 0),
        y3: ministries.reduce((sum: number, m: any) => sum + (m.totalMesuresNouvellesY3 || 0), 0),
      },
      totalPrevisions: {
        y1: data.totalPrevisionsY1 || 0,
        y2: data.totalPrevisionsY2 || 0,
        y3: data.totalPrevisionsY3 || 0,
      },
      ministries: ministries.map((m: any) => ({
        ministryId: m.ministryId,
        ministryCode: m.ministryCode,
        ministryName: m.ministryName,
        ceilings: {
          y1: m.ceilingY1 || 0,
          y2: m.ceilingY2 || 0,
          y3: m.ceilingY3 || 0,
        },
        previsions: {
          y1: m.totalPrevisionsY1 || 0,
          y2: m.totalPrevisionsY2 || 0,
          y3: m.totalPrevisionsY3 || 0,
        },
        gaps: {
          y1: m.gapY1 || 0,
          y2: m.gapY2 || 0,
          y3: m.gapY3 || 0,
        },
        isConformant: m.respectsCeilingY1 && m.respectsCeilingY2 && m.respectsCeilingY3,
      })),
      conformityStats: {
        totalMinistries: ministries.length,
        conformantMinistries,
        nonConformantMinistries: ministries.length - conformantMinistries,
        conformityRate: ministries.length > 0 ? (conformantMinistries / ministries.length) * 100 : 0,
      },
    };
  }

  /**
   * Exporter le CDSMT en format JSON
   */
  static async exportMinistrySDMT(
    ministryId: string,
    fiscalYear: number,
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    const response = await apiClient.get(
      `${BASE_URL}/ministry/${ministryId}/export?fiscalYear=${fiscalYear}&format=${format}`,
      {
        responseType: format === 'csv' ? 'blob' : 'json',
      }
    );

    if (format === 'csv') {
      return response.data;
    }
    return response.data.data;
  }

  /**
   * Télécharger l'export CSV
   */
  static downloadCSV(blob: Blob, filename: string) {
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

export default CDSMTSynthesisService;
