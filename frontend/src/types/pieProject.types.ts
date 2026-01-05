/**
 * Types for PIE (Plan d'Investissement Exceptionnel) Projects
 */

export interface PIEProject {
  id: string;
  projectCode: string;
  projectName: string;
  description?: string;
  category: PIEProjectCategory;

  // Organizational links
  ministryId: string;
  programId?: string;
  actionId?: string;
  activityId?: string;

  // Financial data
  totalCost: number;
  fundingSourceId: string;

  // Allocations by year
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;

  // Timeline
  startDate?: Date;
  endDate?: Date;

  // Status
  status: PIEProjectStatus;
  priority?: number;

  // Metadata
  justification?: string;
  expectedImpact?: string;
  isRecurrent: boolean;

  createdBy?: string;
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
  fundingSource?: {
    id: string;
    code: string;
    name: string;
  };
}

export enum PIEProjectCategory {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  EQUIPMENT = 'EQUIPMENT',
  REHABILITATION = 'REHABILITATION',
  EXTENSION = 'EXTENSION',
  MODERNIZATION = 'MODERNIZATION',
  OTHER = 'OTHER',
}

export enum PIEProjectStatus {
  DRAFT = 'DRAFT',
  PROPOSED = 'PROPOSED',
  VALIDATED = 'VALIDATED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export interface CreatePIEProjectDto {
  projectCode: string;
  projectName: string;
  description?: string;
  category: PIEProjectCategory;
  ministryId: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  totalCost: number;
  fundingSourceId: string;
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;
  startDate?: Date;
  endDate?: Date;
  status?: PIEProjectStatus;
  priority?: number;
  justification?: string;
  expectedImpact?: string;
  isRecurrent?: boolean;
}

export interface UpdatePIEProjectDto {
  projectCode?: string;
  projectName?: string;
  description?: string;
  category?: PIEProjectCategory;
  ministryId?: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  totalCost?: number;
  fundingSourceId?: string;
  allocationY1?: number;
  allocationY2?: number;
  allocationY3?: number;
  startDate?: Date;
  endDate?: Date;
  status?: PIEProjectStatus;
  priority?: number;
  justification?: string;
  expectedImpact?: string;
  isRecurrent?: boolean;
}

export interface PIEProjectFilters {
  ministryId?: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  fundingSourceId?: string;
  category?: PIEProjectCategory;
  status?: PIEProjectStatus;
  fiscalYear?: number;
}

export interface PIEMinistrySummary {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  projectCount: number;
  totalCost: number;
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;
}

export interface PIECategorySummary {
  category: PIEProjectCategory;
  projectCount: number;
  totalCost: number;
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;
}

export interface PIEProjectValidation {
  isValid: boolean;
  totalProjects: number;
  validProjects: number;
  invalidProjects: number;
  warnings: PIEValidationWarning[];
  errors: PIEValidationError[];
}

export interface PIEValidationWarning {
  projectId: string;
  projectCode: string;
  projectName: string;
  field: string;
  message: string;
  severity: 'WARNING';
}

export interface PIEValidationError {
  projectId: string;
  projectCode: string;
  projectName: string;
  field: string;
  message: string;
  severity: 'ERROR';
}
