// Types pour la structure programmatique (Objectifs et Indicateurs)

import { Program } from './referentiel.types';

// ============================================
// OBJECTIVE TYPES
// ============================================

export interface Objective {
  id: string;
  code: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;

  // Polymorphic relationship
  entityType: 'PROGRAM' | 'ACTION' | 'ACTIVITY';
  programId?: string | null;
  actionId?: string | null;
  activityId?: string | null;

  // Type and classification
  objectiveType?: 'STRATEGIC' | 'OPERATIONAL' | 'SPECIFIC' | null;
  priority?: number | null;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations (optional, included via query params)
  program?: Program;
  action?: Action;
  activity?: Activity;
  indicators?: Indicator[];
}

export interface Action {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  programId: string;
  program?: Program;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  actionId: string;
  action?: Action;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectiveDto {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;

  entityType: 'PROGRAM' | 'ACTION' | 'ACTIVITY';
  programId?: string;
  actionId?: string;
  activityId?: string;

  objectiveType?: 'STRATEGIC' | 'OPERATIONAL' | 'SPECIFIC';
  priority?: number;
  isActive?: boolean;
}

export interface UpdateObjectiveDto {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;

  entityType?: 'PROGRAM' | 'ACTION' | 'ACTIVITY';
  programId?: string;
  actionId?: string;
  activityId?: string;

  objectiveType?: 'STRATEGIC' | 'OPERATIONAL' | 'SPECIFIC';
  priority?: number;
  isActive?: boolean;
}

export interface ObjectiveFilters {
  entityType?: 'PROGRAM' | 'ACTION' | 'ACTIVITY';
  programId?: string;
  actionId?: string;
  activityId?: string;
  objectiveType?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ObjectiveStats {
  total: number;
  byEntityType: Record<string, number>;
  byObjectiveType: Record<string, number>;
  active: number;
  inactive: number;
}

// ============================================
// INDICATOR TYPES
// ============================================

export interface Indicator {
  id: string;
  code: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;

  // Relationship
  objectiveId: string;

  // Measurement details
  unit: string;
  dataSource?: string | null;
  calculationMethod?: string | null;

  // Baseline
  baselineYear?: number | null;
  baselineValue?: number | null;

  // Multi-year targets (N+1, N+2, N+3)
  targetYear1?: number | null;
  targetValue1?: number | null;
  targetYear2?: number | null;
  targetValue2?: number | null;
  targetYear3?: number | null;
  targetValue3?: number | null;

  // Multi-year actuals (N+1, N+2, N+3)
  actualYear1?: number | null;
  actualValue1?: number | null;
  actualYear2?: number | null;
  actualValue2?: number | null;
  actualYear3?: number | null;
  actualValue3?: number | null;

  // Classification
  indicatorType?: 'OUTPUT' | 'OUTCOME' | 'IMPACT' | null;
  frequency?: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | null;

  // Responsible party
  responsibleParty?: string | null;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations (optional)
  objective?: Objective;
}

export interface CreateIndicatorDto {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;

  objectiveId: string;

  unit: string;
  dataSource?: string;
  calculationMethod?: string;

  baselineYear?: number;
  baselineValue?: number;

  targetYear1?: number;
  targetValue1?: number;
  targetYear2?: number;
  targetValue2?: number;
  targetYear3?: number;
  targetValue3?: number;

  indicatorType?: 'OUTPUT' | 'OUTCOME' | 'IMPACT';
  frequency?: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  responsibleParty?: string;
  isActive?: boolean;
}

export interface UpdateIndicatorDto {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;

  objectiveId?: string;

  unit?: string;
  dataSource?: string;
  calculationMethod?: string;

  baselineYear?: number;
  baselineValue?: number;

  targetYear1?: number;
  targetValue1?: number;
  targetYear2?: number;
  targetValue2?: number;
  targetYear3?: number;
  targetValue3?: number;

  actualYear1?: number;
  actualValue1?: number;
  actualYear2?: number;
  actualValue2?: number;
  actualYear3?: number;
  actualValue3?: number;

  indicatorType?: 'OUTPUT' | 'OUTCOME' | 'IMPACT';
  frequency?: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  responsibleParty?: string;
  isActive?: boolean;
}

export interface UpdateActualValuesDto {
  actualYear1?: number;
  actualValue1?: number;
  actualYear2?: number;
  actualValue2?: number;
  actualYear3?: number;
  actualValue3?: number;
}

export interface IndicatorFilters {
  objectiveId?: string;
  indicatorType?: string;
  frequency?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IndicatorStats {
  total: number;
  byType: Record<string, number>;
  byFrequency: Record<string, number>;
  active: number;
  inactive: number;
  withTargets: number;
  withActuals: number;
}

export interface IndicatorPerformance {
  indicatorId: string;
  indicatorName: string;
  unit: string;

  baseline?: {
    year: number;
    value: number;
  };

  performance: Array<{
    year: number;
    target?: number;
    actual?: number;
    achievement?: number; // percentage (actual/target * 100)
    status?: 'ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED' | 'NO_DATA';
  }>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ObjectivesResponse {
  status: string;
  data: {
    objectives: Objective[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface IndicatorsResponse {
  status: string;
  data: {
    indicators: Indicator[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface SingleObjectiveResponse {
  status: string;
  data: Objective;
}

export interface SingleIndicatorResponse {
  status: string;
  data: Indicator;
}

export interface ObjectiveStatsResponse {
  status: string;
  data: ObjectiveStats;
}

export interface IndicatorStatsResponse {
  status: string;
  data: IndicatorStats;
}

export interface IndicatorPerformanceResponse {
  status: string;
  data: IndicatorPerformance;
}
