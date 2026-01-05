// ============================================================================
// TREND BUDGET CONFIG
// ============================================================================

export interface TrendBudgetConfig {
  id: string;
  configCode: string;
  name: string;
  description?: string;
  fiscalYear: number;
  baselineStartYear: number;
  baselineEndYear: number;
  globalGrowthRate: number;
  projectionYears: number;
  excludeTemporary: boolean;
  status: 'DRAFT' | 'VALIDATED' | 'APPROVED';
  createdBy?: string;
  validatedBy?: string;
  validatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    historicalBudgets: number;
    trendProjections: number;
  };
}

export interface CreateTrendBudgetConfigDto {
  configCode: string;
  name: string;
  description?: string;
  fiscalYear: number;
  baselineStartYear: number;
  baselineEndYear: number;
  globalGrowthRate: number;
  projectionYears?: number;
  excludeTemporary?: boolean;
}

export interface UpdateTrendBudgetConfigDto {
  name?: string;
  description?: string;
  fiscalYear?: number;
  baselineStartYear?: number;
  baselineEndYear?: number;
  globalGrowthRate?: number;
  projectionYears?: number;
  excludeTemporary?: boolean;
}

// ============================================================================
// HISTORICAL BUDGET
// ============================================================================

export interface HistoricalBudget {
  id: string;
  trendConfigId: string;
  ministryId: string;
  programId?: string;
  economicNatureId?: string;
  fundingSourceId?: string;
  fiscalYear: number;
  budgetAmount: number;
  executedAmount?: number;
  isTemporary: boolean;
  notes?: string;
  importSource?: string;
  importedAt?: string;
  importedBy?: string;
  createdAt: string;
  updatedAt: string;
  ministry?: {
    code: string;
    name: string;
    isPriority: boolean;
  };
  program?: {
    code: string;
    name: string;
  };
  economicNature?: {
    code: string;
    name: string;
  };
  fundingSource?: {
    code: string;
    name: string;
  };
}

export interface CreateHistoricalBudgetDto {
  trendConfigId: string;
  ministryId: string;
  programId?: string;
  economicNatureId?: string;
  fundingSourceId?: string;
  fiscalYear: number;
  budgetAmount: number;
  executedAmount?: number;
  isTemporary?: boolean;
  notes?: string;
}

export interface UpdateHistoricalBudgetDto {
  budgetAmount?: number;
  executedAmount?: number;
  isTemporary?: boolean;
  notes?: string;
}

// ============================================================================
// TREND PROJECTION
// ============================================================================

export interface TrendProjection {
  id: string;
  trendConfigId: string;
  ministryId: string;
  programId?: string;
  economicNatureId?: string;
  fundingSourceId?: string;
  baseAmount: number;
  historicalYearsUsed: number[];
  temporaryExcluded: boolean;
  projectionYear1: number;
  projectedAmount1: number;
  growthRate1: number;
  projectionYear2: number;
  projectedAmount2: number;
  growthRate2: number;
  projectionYear3: number;
  projectedAmount3: number;
  growthRate3: number;
  isPriorityMinistry: boolean;
  calculationMethod: 'AUTO' | 'MANUAL' | 'HYBRID';
  lastCalculatedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  ministry?: {
    code: string;
    name: string;
    isPriority: boolean;
  };
  program?: {
    code: string;
    name: string;
  };
  economicNature?: {
    code: string;
    name: string;
  };
  fundingSource?: {
    code: string;
    name: string;
  };
  trendConfig?: TrendBudgetConfig;
}

export interface UpdateTrendProjectionDto {
  projectedAmount1?: number;
  growthRate1?: number;
  projectedAmount2?: number;
  growthRate2?: number;
  projectedAmount3?: number;
  growthRate3?: number;
  notes?: string;
}

// ============================================================================
// SUMMARIES
// ============================================================================

export interface TrendSummaryByMinistry {
  ministryId: string;
  ministryName: string;
  isPriority: boolean;
  totalBase: number;
  totalN1: number;
  totalN2: number;
  totalN3: number;
  projectionCount: number;
}

export interface TrendSummaryByPriority {
  isPriority: boolean;
  ministryCount: number;
  totalBase: number;
  totalN1: number;
  totalN2: number;
  totalN3: number;
  projectionCount: number;
}

export interface CoherenceValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface ComparisonReport {
  config: {
    code: string;
    name: string;
    fiscalYear: number;
    globalGrowthRate: number;
    status: string;
  };
  totals: {
    base: number;
    n1: number;
    n2: number;
    n3: number;
  };
  variations: {
    n1: number;
    n2: number;
    n3: number;
  };
  summaryByMinistry: TrendSummaryByMinistry[];
  summaryByPriority: TrendSummaryByPriority[];
  coherence: CoherenceValidation;
  generatedAt: string;
}

// ============================================================================
// FILTERS & PAGINATION
// ============================================================================

export interface TrendBudgetConfigFilters {
  fiscalYear?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface HistoricalBudgetFilters {
  ministryId?: string;
  fiscalYear?: number;
  isTemporary?: boolean;
  page?: number;
  limit?: number;
}

export interface TrendProjectionFilters {
  ministryId?: string;
  isPriorityMinistry?: boolean;
  calculationMethod?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================================================
// IMPORT RESULT
// ============================================================================

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row?: any;
    error: string;
  }>;
  warnings: any[];
}

// ============================================================================
// CALCULATION RESULT
// ============================================================================

export interface CalculationResult {
  calculated: number;
  errors: Array<{
    item?: any;
    error: string;
  }>;
}
