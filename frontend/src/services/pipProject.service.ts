import api from '../config/api';
import {
  PIPProject,
  CreatePIPProjectDto,
  UpdatePIPProjectDto,
  PIPProjectFilters,
  PIPMinistrySummary,
  PIPFundingSourceSummary,
  PIPProjectValidation,
} from '../types/pipProject.types';

class PIPProjectService {
  /**
   * Get all PIP projects with optional filters
   */
  async getPIPProjects(filters?: PIPProjectFilters): Promise<PIPProject[]> {
    const response = await api.get('/pip-projects', { params: filters });
    if (response.data.status === 'success') {
      return response.data.data.data || response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projets PIP');
  }

  /**
   * Get a single PIP project by ID
   */
  async getPIPProject(id: string): Promise<PIPProject> {
    const response = await api.get(`/pip-projects/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du projet PIP');
  }

  /**
   * Create a new PIP project
   */
  async createPIPProject(data: CreatePIPProjectDto): Promise<PIPProject> {
    const response = await api.post('/pip-projects', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création du projet PIP');
  }

  /**
   * Update an existing PIP project
   */
  async updatePIPProject(id: string, data: UpdatePIPProjectDto): Promise<PIPProject> {
    const response = await api.put(`/pip-projects/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du projet PIP');
  }

  /**
   * Delete a PIP project
   */
  async deletePIPProject(id: string): Promise<void> {
    const response = await api.delete(`/pip-projects/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression du projet PIP');
    }
  }

  /**
   * Get PIP projects summary by ministry
   */
  async getSummaryByMinistry(fiscalYear?: number): Promise<PIPMinistrySummary[]> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await api.get('/pip-projects/summary/ministry', { params });
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé par ministère');
  }

  /**
   * Get PIP projects summary by funding source
   */
  async getSummaryByFundingSource(): Promise<PIPFundingSourceSummary[]> {
    const response = await api.get('/pip-projects/summary/funding-source');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé par source de financement');
  }

  /**
   * Get recurrent PIP projects
   */
  async getRecurrentProjects(): Promise<PIPProject[]> {
    const response = await api.get('/pip-projects/recurrent');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projets récurrents');
  }

  /**
   * Get externally funded PIP projects
   */
  async getExternallyFundedProjects(): Promise<PIPProject[]> {
    const response = await api.get('/pip-projects/external');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projets financés à l\'extérieur');
  }

  /**
   * Validate PIP projects
   */
  async validateProjects(): Promise<PIPProjectValidation> {
    const response = await api.get('/pip-projects/validate');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la validation des projets PIP');
  }
}

export default new PIPProjectService();
