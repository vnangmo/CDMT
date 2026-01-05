/**
 * Types for Sectoral Measures (Mesures Nouvelles Sectorielles)
 */

export interface SectoralMeasure {
  id: string;
  measureCode: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;

  // Polymorphic linkage: ACTION or ACTIVITY
  entityType: EntityType;
  ministryId: string;
  programId?: string;
  actionId?: string;
  activityId?: string;

  // Classification
  category?: string;
  priority?: number;

  // Multi-year costing (quantity × unit cost)
  quantityY1: number;
  unitCostY1: number;
  totalCostY1: number;

  quantityY2: number;
  unitCostY2: number;
  totalCostY2: number;

  quantityY3: number;
  unitCostY3: number;
  totalCostY3: number;

  totalCost: number;

  // Economic classification
  economicNatureId?: string;
  fundingSourceId?: string;

  // Justification
  justification?: string;
  expectedImpact?: string;
  performanceIndicator?: string;

  // Status workflow
  status: SectoralMeasureStatus;
  submittedAt?: Date;
  submittedBy?: string;
  validatedAt?: Date;
  validatedBy?: string;
  integratedAt?: Date;
  rejectionReason?: string;

  fiscalYear: number;

  createdBy?: string;
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
  fundingSource?: {
    id: string;
    code: string;
    name: string;
  };
}

export enum EntityType {
  ACTION = 'ACTION',
  ACTIVITY = 'ACTIVITY',
}

export enum SectoralMeasureStatus {
  DRAFT = 'DRAFT',
  PROPOSED = 'PROPOSED',
  VALIDATED = 'VALIDATED',
  INTEGRATED = 'INTEGRATED',
  REJECTED = 'REJECTED',
}

export interface CreateSectoralMeasureDto {
  measureCode: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  entityType: EntityType;
  ministryId: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  category?: string;
  priority?: number;
  quantityY1?: number;
  unitCostY1?: number;
  quantityY2?: number;
  unitCostY2?: number;
  quantityY3?: number;
  unitCostY3?: number;
  economicNatureId?: string;
  fundingSourceId?: string;
  justification?: string;
  expectedImpact?: string;
  performanceIndicator?: string;
  fiscalYear: number;
}

export interface UpdateSectoralMeasureDto {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  category?: string;
  priority?: number;
  quantityY1?: number;
  unitCostY1?: number;
  quantityY2?: number;
  unitCostY2?: number;
  quantityY3?: number;
  unitCostY3?: number;
  economicNatureId?: string;
  fundingSourceId?: string;
  justification?: string;
  expectedImpact?: string;
  performanceIndicator?: string;
}

export interface SectoralMeasureFilters {
  ministryId?: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  entityType?: EntityType;
  category?: string;
  status?: SectoralMeasureStatus;
  fiscalYear?: number;
}

export interface SectoralMeasureSummary {
  ministryId?: string;
  ministryName?: string;
  category?: string;
  measureCount: number;
  totalCostY1: number;
  totalCostY2: number;
  totalCostY3: number;
  totalCost: number;
}

export interface CeilingValidation {
  isValid: boolean;
  hasExceedances: boolean;
  totalExceedances: number;
  exceedances: CeilingExceedance[];
  warnings: string[];
  errors: string[];
}

export interface CeilingExceedance {
  ministryId: string;
  ministryName: string;
  year: number;
  ceiling: number;
  projectedAmount: number;
  exceedance: number;
  exceedancePercentage: number;
  severity: 'WARNING' | 'CRITICAL';
}

export interface AvailableMargin {
  ministryId: string;
  fiscalYear: number;
  year1: YearMargin;
  year2: YearMargin;
  year3: YearMargin;
}

export interface YearMargin {
  ceiling: number;
  used: number;
  available: number;
  availablePercentage: number;
}

export interface IntegrationResult {
  success: boolean;
  ministryId: string;
  fiscalYear: number;
  measuresIntegrated: number;
  ceilingsUpdated: number;
  errors: string[];
  warnings: string[];
}

export interface IntegrationStatus {
  ministryId: string;
  fiscalYear: number;
  total: number;
  byStatus: {
    draft: number;
    proposed: number;
    validated: number;
    integrated: number;
    rejected: number;
  };
  amounts: {
    validatedY1: number;
    validatedY2: number;
    validatedY3: number;
    integratedY1: number;
    integratedY2: number;
    integratedY3: number;
  };
  status: {
    isFullyIntegrated: boolean;
    isPendingIntegration: boolean;
    canIntegrate: boolean;
    canRollback: boolean;
  };
}

export interface IntegrationPreview {
  ministryId: string;
  fiscalYear: number;
  measuresToIntegrate: number;
  impact: YearImpact[];
  canProceed: boolean;
  message: string;
}

export interface YearImpact {
  year: number;
  currentCeiling: number;
  currentNewMeasures: number;
  newMeasuresAmount: number;
  updatedNewMeasures: number;
  updatedCeiling: number;
  delta: number;
}

export interface CostBreakdown {
  economicNature?: {
    id: string;
    code: string;
    name: string;
    totalY1: number;
    totalY2: number;
    totalY3: number;
    total: number;
    percentage: number;
  }[];
  fundingSource?: {
    id: string;
    code: string;
    name: string;
    totalY1: number;
    totalY2: number;
    totalY3: number;
    total: number;
    percentage: number;
  }[];
}

export interface ValidationReport {
  fiscalYear: number;
  ministryId: string;
  ceilingValidation: CeilingValidation;
  marginAnalysis: AvailableMargin;
  coherenceValidation: {
    isValid: boolean;
    totalMeasures: number;
    validMeasures: number;
    invalidMeasures: number;
    issues: any[];
  };
  overallStatus: 'VALID' | 'INVALID';
  generatedAt: Date;
}
