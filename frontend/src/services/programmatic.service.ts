import api from '../config/api';
import {
  Objective,
  Indicator,
  CreateObjectiveDto,
  UpdateObjectiveDto,
  CreateIndicatorDto,
  UpdateIndicatorDto,
  UpdateActualValuesDto,
  ObjectiveFilters,
  IndicatorFilters,
  ObjectivesResponse,
  IndicatorsResponse,
  SingleObjectiveResponse,
  SingleIndicatorResponse,
  ObjectiveStatsResponse,
  IndicatorStatsResponse,
  IndicatorPerformanceResponse,
} from '../types/programmatic.types';

class ProgrammaticService {
  // ============================================
  // OBJECTIVES
  // ============================================

  async getObjectives(filters?: ObjectiveFilters): Promise<{ objectives: Objective[]; pagination: any }> {
    const params = new URLSearchParams();

    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.programId) params.append('programId', filters.programId);
    if (filters?.actionId) params.append('actionId', filters.actionId);
    if (filters?.activityId) params.append('activityId', filters.activityId);
    if (filters?.objectiveType) params.append('objectiveType', filters.objectiveType);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<ObjectivesResponse>(`/objectives?${params.toString()}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des objectifs');
  }

  async getObjective(id: string): Promise<Objective> {
    const response = await api.get<SingleObjectiveResponse>(`/objectives/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération de l\'objectif');
  }

  async createObjective(data: CreateObjectiveDto): Promise<Objective> {
    const response = await api.post<SingleObjectiveResponse>('/objectives', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la création de l\'objectif');
  }

  async updateObjective(id: string, data: UpdateObjectiveDto): Promise<Objective> {
    const response = await api.put<SingleObjectiveResponse>(`/objectives/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la mise à jour de l\'objectif');
  }

  async deleteObjective(id: string): Promise<void> {
    const response = await api.delete(`/objectives/${id}`);
    if (response.data.status !== 'success') {
      throw new Error('Erreur lors de la suppression de l\'objectif');
    }
  }

  async getObjectivesByProgram(programId: string): Promise<Objective[]> {
    const response = await api.get<{ status: string; data: Objective[] }>(`/objectives/program/${programId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des objectifs du programme');
  }

  async getObjectivesByAction(actionId: string): Promise<Objective[]> {
    const response = await api.get<{ status: string; data: Objective[] }>(`/objectives/action/${actionId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des objectifs de l\'action');
  }

  async getObjectivesByActivity(activityId: string): Promise<Objective[]> {
    const response = await api.get<{ status: string; data: Objective[] }>(`/objectives/activity/${activityId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des objectifs de l\'activité');
  }

  async getObjectiveStats(): Promise<any> {
    const response = await api.get<ObjectiveStatsResponse>('/objectives/stats');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des statistiques des objectifs');
  }

  // ============================================
  // INDICATORS
  // ============================================

  async getIndicators(filters?: IndicatorFilters): Promise<{ indicators: Indicator[]; pagination: any }> {
    const params = new URLSearchParams();

    if (filters?.objectiveId) params.append('objectiveId', filters.objectiveId);
    if (filters?.indicatorType) params.append('indicatorType', filters.indicatorType);
    if (filters?.frequency) params.append('frequency', filters.frequency);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<IndicatorsResponse>(`/indicators?${params.toString()}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des indicateurs');
  }

  async getIndicator(id: string): Promise<Indicator> {
    const response = await api.get<SingleIndicatorResponse>(`/indicators/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération de l\'indicateur');
  }

  async createIndicator(data: CreateIndicatorDto): Promise<Indicator> {
    const response = await api.post<SingleIndicatorResponse>('/indicators', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la création de l\'indicateur');
  }

  async updateIndicator(id: string, data: UpdateIndicatorDto): Promise<Indicator> {
    const response = await api.put<SingleIndicatorResponse>(`/indicators/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la mise à jour de l\'indicateur');
  }

  async deleteIndicator(id: string): Promise<void> {
    const response = await api.delete(`/indicators/${id}`);
    if (response.data.status !== 'success') {
      throw new Error('Erreur lors de la suppression de l\'indicateur');
    }
  }

  async getIndicatorsByObjective(objectiveId: string): Promise<Indicator[]> {
    const response = await api.get<{ status: string; data: Indicator[] }>(`/indicators/objective/${objectiveId}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des indicateurs de l\'objectif');
  }

  async updateActualValues(id: string, data: UpdateActualValuesDto): Promise<Indicator> {
    const response = await api.put<SingleIndicatorResponse>(`/indicators/${id}/actual-values`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la mise à jour des valeurs réelles');
  }

  async getIndicatorPerformance(id: string): Promise<any> {
    const response = await api.get<IndicatorPerformanceResponse>(`/indicators/${id}/performance`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération de la performance de l\'indicateur');
  }

  async getIndicatorStats(): Promise<any> {
    const response = await api.get<IndicatorStatsResponse>('/indicators/stats');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des statistiques des indicateurs');
  }
}

export default new ProgrammaticService();
