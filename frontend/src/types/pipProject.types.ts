/**
 * Types for PIP (Programme d'Investissement Public) Projects
 */

export interface PIPProject {
  id: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: PIPProjectType;

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

  // Funding nature
  isExternallyFunded: boolean;
  externalFundingAgency?: string;
  externalFundingAmount?: number;

  // Timeline
  startDate?: Date;
  endDate?: Date;

  // Classification
  category: PIPProjectCategory;
  sector?: string;
  isRecurrent: boolean;

  // Status and priority
  status: PIPProjectStatus;
  priority?: number;

  // Metadata
  objectives?: string;
  expectedResults?: string;
  justification?: string;

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

export enum PIPProjectType {
  NEW_INVESTMENT = 'NEW_INVESTMENT',
  REHABILITATION = 'REHABILITATION',
  EXTENSION = 'EXTENSION',
  MODERNIZATION = 'MODERNIZATION',
  REPLACEMENT = 'REPLACEMENT',
  OTHER = 'OTHER',
}

export enum PIPProjectCategory {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  EQUIPMENT = 'EQUIPMENT',
  SOCIAL = 'SOCIAL',
  ECONOMIC = 'ECONOMIC',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  ENVIRONMENT = 'ENVIRONMENT',
  OTHER = 'OTHER',
}

export enum PIPProjectStatus {
  DRAFT = 'DRAFT',
  PROPOSED = 'PROPOSED',
  VALIDATED = 'VALIDATED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export interface CreatePIPProjectDto {
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: PIPProjectType;
  ministryId: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  totalCost: number;
  fundingSourceId: string;
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;
  isExternallyFunded?: boolean;
  externalFundingAgency?: string;
  externalFundingAmount?: number;
  startDate?: Date;
  endDate?: Date;
  category: PIPProjectCategory;
  sector?: string;
  isRecurrent?: boolean;
  status?: PIPProjectStatus;
  priority?: number;
  objectives?: string;
  expectedResults?: string;
  justification?: string;
}

export interface UpdatePIPProjectDto {
  projectCode?: string;
  projectName?: string;
  description?: string;
  projectType?: PIPProjectType;
  ministryId?: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  totalCost?: number;
  fundingSourceId?: string;
  allocationY1?: number;
  allocationY2?: number;
  allocationY3?: number;
  isExternallyFunded?: boolean;
  externalFundingAgency?: string;
  externalFundingAmount?: number;
  startDate?: Date;
  endDate?: Date;
  category?: PIPProjectCategory;
  sector?: string;
  isRecurrent?: boolean;
  status?: PIPProjectStatus;
  priority?: number;
  objectives?: string;
  expectedResults?: string;
  justification?: string;
}

export interface PIPProjectFilters {
  ministryId?: string;
  programId?: string;
  actionId?: string;
  activityId?: string;
  fundingSourceId?: string;
  category?: PIPProjectCategory;
  projectType?: PIPProjectType;
  status?: PIPProjectStatus;
  isRecurrent?: boolean;
  fiscalYear?: number;
}

export interface PIPMinistrySummary {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  projectCount: number;
  totalCost: number;
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;
  externalFunding: number;
}

export interface PIPFundingSourceSummary {
  fundingSourceId: string;
  fundingSourceCode: string;
  fundingSourceName: string;
  projectCount: number;
  totalCost: number;
  allocationY1: number;
  allocationY2: number;
  allocationY3: number;
}

export interface PIPProjectValidation {
  isValid: boolean;
  totalProjects: number;
  validProjects: number;
  invalidProjects: number;
  warnings: PIPValidationWarning[];
  errors: PIPValidationError[];
}

export interface PIPValidationWarning {
  projectId: string;
  projectCode: string;
  projectName: string;
  field: string;
  message: string;
  severity: 'WARNING';
}

export interface PIPValidationError {
  projectId: string;
  projectCode: string;
  projectName: string;
  field: string;
  message: string;
  severity: 'ERROR';
}
