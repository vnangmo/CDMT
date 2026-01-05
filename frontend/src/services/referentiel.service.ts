import api from '../config/api';
import {
  Ministry,
  Program,
  StrategicAxis,
  EconomicNature,
  FundingSource,
  FiscalYear,
  CreateMinistryDto,
  UpdateMinistryDto,
  CreateProgramDto,
  UpdateProgramDto,
  CreateStrategicAxisDto,
  UpdateStrategicAxisDto,
  CreateEconomicNatureDto,
  UpdateEconomicNatureDto,
  CreateFundingSourceDto,
  UpdateFundingSourceDto,
  CreateFiscalYearDto,
  UpdateFiscalYearDto
} from '../types/referentiel.types';

class ReferentielService {
  // === MINISTÈRES ===
  async getMinistries(): Promise<Ministry[]> {
    const response = await api.get('/ministries');
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des ministères');
  }

  async getMinistry(id: string): Promise<Ministry> {
    const response = await api.get(`/ministries/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du ministère');
  }

  async createMinistry(data: CreateMinistryDto): Promise<Ministry> {
    const response = await api.post('/ministries', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création du ministère');
  }

  async updateMinistry(id: string, data: UpdateMinistryDto): Promise<Ministry> {
    const response = await api.patch(`/ministries/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du ministère');
  }

  async deleteMinistry(id: string): Promise<void> {
    const response = await api.delete(`/ministries/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression du ministère');
    }
  }

  // === PROGRAMMES ===
  async getPrograms(): Promise<Program[]> {
    const response = await api.get('/programs');
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des programmes');
  }

  async getProgram(id: string): Promise<Program> {
    const response = await api.get(`/programs/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du programme');
  }

  async createProgram(data: CreateProgramDto): Promise<Program> {
    const response = await api.post('/programs', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création du programme');
  }

  async updateProgram(id: string, data: UpdateProgramDto): Promise<Program> {
    const response = await api.patch(`/programs/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du programme');
  }

  async deleteProgram(id: string): Promise<void> {
    const response = await api.delete(`/programs/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression du programme');
    }
  }

  // === AXES STRATÉGIQUES ===
  async getStrategicAxes(): Promise<StrategicAxis[]> {
    const response = await api.get('/strategic-axes');
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des axes stratégiques');
  }

  async getStrategicAxis(id: string): Promise<StrategicAxis> {
    const response = await api.get(`/strategic-axes/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de l\'axe stratégique');
  }

  async createStrategicAxis(data: CreateStrategicAxisDto): Promise<StrategicAxis> {
    const response = await api.post('/strategic-axes', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de l\'axe stratégique');
  }

  async updateStrategicAxis(id: string, data: UpdateStrategicAxisDto): Promise<StrategicAxis> {
    const response = await api.patch(`/strategic-axes/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'axe stratégique');
  }

  async deleteStrategicAxis(id: string): Promise<void> {
    const response = await api.delete(`/strategic-axes/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de l\'axe stratégique');
    }
  }

  // === NATURES ÉCONOMIQUES ===
  async getEconomicNatures(): Promise<EconomicNature[]> {
    const response = await api.get('/economic-natures');
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des natures économiques');
  }

  async getEconomicNature(id: string): Promise<EconomicNature> {
    const response = await api.get(`/economic-natures/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de la nature économique');
  }

  async createEconomicNature(data: CreateEconomicNatureDto): Promise<EconomicNature> {
    const response = await api.post('/economic-natures', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de la nature économique');
  }

  async updateEconomicNature(id: string, data: UpdateEconomicNatureDto): Promise<EconomicNature> {
    const response = await api.patch(`/economic-natures/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de la nature économique');
  }

  async deleteEconomicNature(id: string): Promise<void> {
    const response = await api.delete(`/economic-natures/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de la nature économique');
    }
  }

  // === SOURCES DE FINANCEMENT ===
  async getFundingSources(): Promise<FundingSource[]> {
    const response = await api.get('/funding-sources');
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des sources de financement');
  }

  async getFundingSource(id: string): Promise<FundingSource> {
    const response = await api.get(`/funding-sources/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de la source de financement');
  }

  async createFundingSource(data: CreateFundingSourceDto): Promise<FundingSource> {
    const response = await api.post('/funding-sources', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de la source de financement');
  }

  async updateFundingSource(id: string, data: UpdateFundingSourceDto): Promise<FundingSource> {
    const response = await api.patch(`/funding-sources/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de la source de financement');
  }

  async deleteFundingSource(id: string): Promise<void> {
    const response = await api.delete(`/funding-sources/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de la source de financement');
    }
  }

  // === EXERCICES BUDGÉTAIRES ===
  async getFiscalYears(): Promise<FiscalYear[]> {
    const response = await api.get('/fiscal-years');
    if (response.data.status === 'success') {
      return response.data.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des exercices budgétaires');
  }

  async getFiscalYear(id: string): Promise<FiscalYear> {
    const response = await api.get(`/fiscal-years/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de l\'exercice budgétaire');
  }

  async createFiscalYear(data: CreateFiscalYearDto): Promise<FiscalYear> {
    const response = await api.post('/fiscal-years', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de l\'exercice budgétaire');
  }

  async updateFiscalYear(id: string, data: UpdateFiscalYearDto): Promise<FiscalYear> {
    const response = await api.patch(`/fiscal-years/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'exercice budgétaire');
  }

  async deleteFiscalYear(id: string): Promise<void> {
    const response = await api.delete(`/fiscal-years/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de l\'exercice budgétaire');
    }
  }

  async closeFiscalYear(id: string): Promise<FiscalYear> {
    const response = await api.patch(`/fiscal-years/${id}/close`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la clôture de l\'exercice budgétaire');
  }
}

const referentielService = new ReferentielService();
export default referentielService;
