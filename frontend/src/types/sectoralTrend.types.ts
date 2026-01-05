/**
 * Types for Sectoral Trend Budgets
 */

export interface SectoralTrendProjection {
  id: string;
  trendConfigId: string;
  ministryId: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  economicNatureId: string;

  // Historical baseline
  baselineYear: number;
  baselineAmount: number;
  exceptionalExpenses: number;
  adjustedBaseline: number;

  // Growth parameters
  growthRate: number;
  inflationRate: number;
  adjustmentFactor: number;

  // Projections
  projectedAmount1: number; // Year N+1
  projectedAmount2: number; // Year N+2
  projectedAmount3: number; // Year N+3

  // Metadata
  calculationMethod: CalculationMethod;
  notes?: string;
  calculatedAt?: Date;
  validatedBy?: string;
  validatedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  // Relations (populated)
  ministry?: {
    id: string;
    code: string;
    name: string;
  };
  program?: {
    id: string;
    code: string;
    name: string;
  };
  action?: {
    id: string;
    code: string;
    name: string;
  };
  activity?: {
    id: string;
    code: string;
    name: string;
  };
  economicNature?: {
    id: string;
    code: string;
    name: string;
  };
}

export enum CalculationMethod {
  TREND = 'TREND',
  MANUAL = 'MANUAL',
  INDEXED = 'INDEXED',
  NORMATIVE = 'NORMATIVE',
}

export interface CalculateSectoralProjectionsDto {
  trendConfigId: string;
  baselineYear: number;
  defaultGrowthRate?: number;
  defaultInflationRate?: number;
  excludeExceptionalExpenses?: boolean;
}

export interface CalculationResult {
  calculated: number;
  updated: number;
  errors: CalculationError[];
  warnings: string[];
  summary: {
    totalBaseline: number;
    totalExceptional: number;
    totalAdjusted: number;
    totalProjectedY1: number;
    totalProjectedY2: number;
    totalProjectedY3: number;
  };
}

export interface CalculationError {
  ministryId?: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  economicNatureId?: string;
  message: string;
}

export interface ActionSummary {
  actionId: string;
  actionCode: string;
  actionName: string;
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  programId?: string;
  programCode?: string;
  programName?: string;
  baselineAmount: number;
  exceptionalExpenses: number;
  adjustedBaseline: number;
  projectedY1: number;
  projectedY2: number;
  projectedY3: number;
}

export interface ActivitySummary {
  activityId: string;
  activityCode: string;
  activityName: string;
  actionId: string;
  actionCode: string;
  actionName: string;
  programId?: string;
  programCode?: string;
  programName?: string;
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  baselineAmount: number;
  exceptionalExpenses: number;
  adjustedBaseline: number;
  projectedY1: number;
  projectedY2: number;
  projectedY3: number;
}

export interface CeilingExceedance {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  year: number;
  projectedAmount: number;
  ceiling: number;
  exceedance: number;
  exceedancePercentage: number;
  severity: 'WARNING' | 'CRITICAL';
}

export interface CeilingExceedancesResult {
  hasExceedances: boolean;
  totalExceedances: number;
  exceedances: CeilingExceedance[];
  summary: {
    totalProjected: number;
    totalCeilings: number;
    totalExceedance: number;
  };
}

export interface CDMTGlobalCeiling {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  fiscalYear: number;
  ceilingY1: number;
  ceilingY2: number;
  ceilingY3: number;
  baseline: number;
  newMeasures: number;
  allocatedSpace: number;
}

export interface IntegratePIEPIPResult {
  integrated: number;
  pieIntegrated: number;
  pipIntegrated: number;
  totalAmount: number;
  details: PIEPIPIntegrationDetail[];
}

export interface PIEPIPIntegrationDetail {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectType: 'PIE' | 'PIP';
  ministryId: string;
  actionId?: string;
  activityId?: string;
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;
  integrated: boolean;
  error?: string;
}

export interface SectoralCoherenceValidation {
  isCoherent: boolean;
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  checks: CoherenceCheck[];
  warnings: string[];
  errors: string[];
  summary: {
    totalProjections: number;
    totalBaseline: number;
    totalProjectedY1: number;
    totalProjectedY2: number;
    totalProjectedY3: number;
    totalCeilingY1: number;
    totalCeilingY2: number;
    totalCeilingY3: number;
    gapY1: number;
    gapY2: number;
    gapY3: number;
  };
}

export interface CoherenceCheck {
  checkType: 'CEILING_COMPLIANCE' | 'STRUCTURE_INTEGRITY' | 'CALCULATION_ACCURACY' | 'DATA_COMPLETENESS';
  passed: boolean;
  message: string;
  details?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface SectoralTrendFilters {
  trendConfigId?: string;
  ministryId?: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  economicNatureId?: string;
  year?: number;
}
