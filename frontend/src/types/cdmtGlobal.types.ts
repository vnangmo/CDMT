// CDMT Global Types
export interface CDMTGlobalScenario {
  id: string;
  scenarioCode: string;
  name: string;
  description?: string;
  fiscalYear: number;
  macroFrameworkId: string;
  trendConfigId?: string;

  // Fiscal margins
  fiscalMarginY1: number;
  fiscalMarginY2: number;
  fiscalMarginY3: number;

  // Calculated totals
  totalBaselineY1: number;
  totalBaselineY2: number;
  totalBaselineY3: number;
  totalMeasuresY1: number;
  totalMeasuresY2: number;
  totalMeasuresY3: number;
  totalAllocatedY1: number;
  totalAllocatedY2: number;
  totalAllocatedY3: number;
  totalCeilingY1: number;
  totalCeilingY2: number;
  totalCeilingY3: number;

  // Status and workflow
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isActive: boolean;
  activatedAt?: string;
  activatedBy?: string;
  createdBy?: string;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (when included)
  macroFramework?: {
    id: string;
    name: string;
    fiscalYear: number;
  };
  trendConfig?: {
    id: string;
    name: string;
    fiscalYear: number;
  };
  policyMeasures?: PolicyMeasure[];
  marginAllocations?: MarginAllocation[];
  ministerialCeilings?: MinisterialCeiling[];
}

export interface PolicyMeasure {
  id: string;
  scenarioId: string;
  ministryId: string;
  measureCode?: string;
  measureName: string;
  description?: string;
  category?: 'PERSONNEL' | 'INVESTMENT' | 'OPERATION' | 'OTHER';
  amountY1: number;
  amountY2: number;
  amountY3: number;
  justification?: string;
  source?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  ministry?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface MarginAllocation {
  id: string;
  scenarioId: string;
  ministryId: string;
  allocatedY1: number;
  allocatedY2: number;
  allocatedY3: number;
  notes?: string;
  allocationMethod?: 'MANUAL' | 'FORMULA_SUGGESTION';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  ministry?: {
    id: string;
    code: string;
    name: string;
    isPriority?: boolean;
  };
}

export interface MinisterialCeiling {
  id: string;
  scenarioId?: string;
  ministryId: string;
  budgetYear: number;
  year: number;
  baseline: number;
  newMeasures: number;
  allocatedSpace: number;
  ceiling: number;
  calculatedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  ministry?: {
    id: string;
    code: string;
    name: string;
    isPriority?: boolean;
  };
}

// DTOs for create/update operations
export interface CreateCDMTGlobalScenarioDto {
  scenarioCode: string;
  name: string;
  description?: string;
  fiscalYear: number;
  macroFrameworkId: string;
  trendConfigId?: string;
}

export interface UpdateCDMTGlobalScenarioDto {
  name?: string;
  description?: string;
  fiscalYear?: number;
  macroFrameworkId?: string;
  trendConfigId?: string;
}

export interface CreatePolicyMeasureDto {
  ministryId: string;
  measureCode?: string;
  measureName: string;
  description?: string;
  category?: 'PERSONNEL' | 'INVESTMENT' | 'OPERATION' | 'OTHER';
  amountY1: number;
  amountY2: number;
  amountY3: number;
  justification?: string;
  source?: string;
}

export interface UpdatePolicyMeasureDto {
  measureName?: string;
  description?: string;
  category?: 'PERSONNEL' | 'INVESTMENT' | 'OPERATION' | 'OTHER';
  amountY1?: number;
  amountY2?: number;
  amountY3?: number;
  justification?: string;
  source?: string;
}

export interface UpdateMarginAllocationDto {
  allocatedY1?: number;
  allocatedY2?: number;
  allocatedY3?: number;
  notes?: string;
  allocationMethod?: 'MANUAL' | 'FORMULA_SUGGESTION';
}

export interface BulkMarginAllocationDto {
  ministryId: string;
  allocatedY1?: number;
  allocatedY2?: number;
  allocatedY3?: number;
  notes?: string;
}

// Response types
export interface ScenarioListResponse {
  scenarios: CDMTGlobalScenario[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScenarioSummary {
  scenarioId: string;
  scenarioName: string;
  fiscalYear: number;
  fiscalMargin: {
    y1: number;
    y2: number;
    y3: number;
  };
  totals: {
    baselineY1: number;
    baselineY2: number;
    baselineY3: number;
    measuresY1: number;
    measuresY2: number;
    measuresY3: number;
    allocatedY1: number;
    allocatedY2: number;
    allocatedY3: number;
    ceilingY1: number;
    ceilingY2: number;
    ceilingY3: number;
  };
}

export interface MarginValidationResult {
  isValid: boolean;
  warnings: string[];
  remainingMarginY1: number;
  remainingMarginY2: number;
  remainingMarginY3: number;
}

export interface RemainingMarginResponse {
  remainingY1: number;
  remainingY2: number;
  remainingY3: number;
  isValid: boolean;
  warnings: string[];
}

export interface CalculationResult {
  calculated: number;
  updated: number;
}

export interface BulkImportResult {
  imported: number;
  measures: PolicyMeasure[];
}

export interface BulkUpdateResult {
  updated: number;
  allocations: MarginAllocation[];
}

export interface ScenarioComparison {
  scenarios: Array<{
    id: string;
    name: string;
    scenarioCode: string;
    fiscalYear: number;
  }>;
  ministries: Array<{
    ministryId: string;
    ministryName: string;
    scenarios: Array<{
      scenarioId: string;
      scenarioName: string;
      ceilings: Array<{
        year: number;
        baseline: number;
        newMeasures: number;
        allocatedSpace: number;
        ceiling: number;
      }>;
    }>;
  }>;
}

export interface ScenarioDifferences {
  scenario1: {
    id: string;
    name: string;
  };
  scenario2: {
    id: string;
    name: string;
  };
  fiscalMargin: {
    y1: {
      scenario1: number;
      scenario2: number;
      diff: number;
    };
    y2: {
      scenario1: number;
      scenario2: number;
      diff: number;
    };
    y3: {
      scenario1: number;
      scenario2: number;
      diff: number;
    };
  };
  ceilings: Array<{
    ministryId: string;
    ministryName: string;
    years: Array<{
      year: number;
      scenario1: {
        baseline: number;
        newMeasures: number;
        allocatedSpace: number;
        ceiling: number;
      };
      scenario2: {
        baseline: number;
        newMeasures: number;
        allocatedSpace: number;
        ceiling: number;
      } | null;
      diff: number | null;
    }>;
  }>;
}

export interface CBMTSyncResult {
  synced: number;
  updated: number;
  created: number;
}

export interface CBMTCreationResult {
  cbmtDocument: {
    id: string;
    documentCode: string;
    title: string;
    fiscalYear: number;
  };
  aggregates: any[];
  message: string;
}

export interface CBMTCoherenceValidation {
  isCoherent: boolean;
  gaps: Array<{
    ministryId: string;
    ministryName: string;
    year: number;
    cdmtGlobalCeiling: number;
    cbmtAggregate: number;
    gap: number;
  }>;
  warnings: string[];
}

export interface ComparisonReport {
  scenarioId: string;
  scenarioName: string;
  fiscalYear: number;
  ministries: Array<{
    ministryCode: string;
    ministryName: string;
    ceilings: Array<{
      year: number;
      baseline: number;
      newMeasures: number;
      allocatedSpace: number;
      ceiling: number;
    }>;
    totalMeasures: number;
    allocation: {
      y1: number;
      y2: number;
      y3: number;
    } | null;
  }>;
}

// Filter types
export interface ScenarioFilters {
  fiscalYear?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  page?: number;
  limit?: number;
}

export interface PolicyMeasureFilters {
  ministryId?: string;
}

export interface CeilingFilters {
  ministryId?: string;
  year?: number;
}
