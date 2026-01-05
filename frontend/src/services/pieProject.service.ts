import api from '../config/api';
import {
  PIEProject,
  CreatePIEProjectDto,
  UpdatePIEProjectDto,
  PIEProjectFilters,
  PIEMinistrySummary,
  PIECategorySummary,
  PIEProjectValidation,
} from '../types/pieProject.types';

class PIEProjectService {
  /**
   * Get all PIE projects with optional filters
   */
  async getPIEProjects(filters?: PIEProjectFilters): Promise<PIEProject[]> {
    const response = await api.get('/pie-projects', { params: filters });
    if (response.data.status === 'success') {
      return response.data.data.data || response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des projets PIE');
  }

  /**
   * Get a single PIE project by ID
   */
  async getPIEProject(id: string): Promise<PIEProject> {
    const response = await api.get(`/pie-projects/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du projet PIE');
  }

  /**
   * Create a new PIE project
   */
  async createPIEProject(data: CreatePIEProjectDto): Promise<PIEProject> {
    const response = await api.post('/pie-projects', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création du projet PIE');
  }

  /**
   * Update an existing PIE project
   */
  async updatePIEProject(id: string, data: UpdatePIEProjectDto): Promise<PIEProject> {
    const response = await api.put(`/pie-projects/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du projet PIE');
  }

  /**
   * Delete a PIE project
   */
  async deletePIEProject(id: string): Promise<void> {
    const response = await api.delete(`/pie-projects/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression du projet PIE');
    }
  }

  /**
   * Get PIE projects summary by ministry
   */
  async getSummaryByMinistry(fiscalYear?: number): Promise<PIEMinistrySummary[]> {
    const params = fiscalYear ? { fiscalYear } : {};
    const response = await api.get('/pie-projects/summary/ministry', { params });
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé par ministère');
  }

  /**
   * Get PIE projects summary by category
   */
  async getSummaryByCategory(): Promise<PIECategorySummary[]> {
    const response = await api.get('/pie-projects/summary/category');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du résumé par catégorie');
  }

  /**
   * Validate PIE projects
   */
  async validateProjects(): Promise<PIEProjectValidation> {
    const response = await api.get('/pie-projects/validate');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la validation des projets PIE');
  }
}

export default new PIEProjectService();
