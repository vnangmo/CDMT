/**
 * Types for Action Plans and Activities
 */

export interface ActionPlan {
  id: string;
  planCode: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;

  sectoralMeasureId: string;
  ministryId: string;
  fiscalYear: number;

  // Timeline
  startDate?: Date;
  endDate?: Date;
  duration?: number;

  // Objectives
  objectives?: string;
  expectedResults?: string;
  performanceIndicators?: any;

  // Resources
  humanResources?: string;
  technicalResources?: string;
  institutionalSupport?: string;

  // Risk management
  risks?: any;
  mitigationMeasures?: string;

  // Costing (aggregated from activities)
  totalCostY1: number;
  totalCostY2: number;
  totalCostY3: number;
  totalCost: number;

  // Status
  status: ActionPlanStatus;
  progress?: number;

  responsibleEntity?: string;
  coordinator?: string;

  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  validatedBy?: string;

  // Relations (populated)
  sectoralMeasure?: {
    id: string;
    measureCode: string;
    name: string;
    totalCostY1: number;
    totalCostY2: number;
    totalCostY3: number;
    totalCost: number;
  };
  ministry?: {
    id: string;
    name: string;
  };
  activities?: ActionPlanActivity[];
}

export interface ActionPlanActivity {
  id: string;
  activityCode: string;
  name: string;
  description?: string;
  actionPlanId: string;

  orderIndex: number;
  dependencies?: string;

  // Timeline
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;

  // Costing (quantity × unit cost)
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

  assignedTo?: string;
  resourceType?: string;
  deliverables?: any;

  status: ActivityStatus;
  progress?: number;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;

  // Relations (populated)
  actionPlan?: {
    id: string;
    planCode: string;
    name: string;
  };
}

export enum ActionPlanStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
}

export enum ActivityStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  SUSPENDED = 'SUSPENDED',
}

export interface CreateActionPlanDto {
  planCode: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  sectoralMeasureId: string;
  ministryId: string;
  fiscalYear: number;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  objectives?: string;
  expectedResults?: string;
  performanceIndicators?: any;
  humanResources?: string;
  technicalResources?: string;
  institutionalSupport?: string;
  risks?: any;
  mitigationMeasures?: string;
  responsibleEntity?: string;
  coordinator?: string;
}

export interface UpdateActionPlanDto {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  objectives?: string;
  expectedResults?: string;
  performanceIndicators?: any;
  humanResources?: string;
  technicalResources?: string;
  institutionalSupport?: string;
  risks?: any;
  mitigationMeasures?: string;
  responsibleEntity?: string;
  coordinator?: string;
  status?: ActionPlanStatus;
  progress?: number;
}

export interface CreateActivityDto {
  activityCode: string;
  name: string;
  description?: string;
  orderIndex?: number;
  dependencies?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  quantityY1?: number;
  unitCostY1?: number;
  quantityY2?: number;
  unitCostY2?: number;
  quantityY3?: number;
  unitCostY3?: number;
  assignedTo?: string;
  resourceType?: string;
  deliverables?: any;
}

export interface UpdateActivityDto {
  name?: string;
  description?: string;
  orderIndex?: number;
  dependencies?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  quantityY1?: number;
  unitCostY1?: number;
  quantityY2?: number;
  unitCostY2?: number;
  quantityY3?: number;
  unitCostY3?: number;
  assignedTo?: string;
  resourceType?: string;
  deliverables?: any;
  status?: ActivityStatus;
  progress?: number;
  notes?: string;
}

export interface ActionPlanFilters {
  ministryId?: string;
  sectoralMeasureId?: string;
  fiscalYear?: number;
  status?: ActionPlanStatus;
}

export interface ActionPlanSummary {
  ministryId: string;
  ministryName?: string;
  planCount: number;
  totalCostY1: number;
  totalCostY2: number;
  totalCostY3: number;
  totalCost: number;
  averageProgress?: number;
}

export interface PerformanceIndicators {
  planId: string;
  planCode: string;
  planName: string;
  status: ActionPlanStatus;
  progress: number;
  activities: {
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
    completionRate: number;
  };
  budget: {
    planned: number;
    executed: number;
    remaining: number;
    executionRate: number;
  };
  timeline: {
    startDate?: Date;
    endDate?: Date;
    duration?: number;
  };
}

export interface ActivitiesSummary {
  total: number;
  byStatus: Record<string, number>;
  totalCost: number;
  completedCost: number;
}

export interface CriticalPath {
  totalActivities: number;
  criticalActivities: number;
  activities: {
    id: string;
    activityCode: string;
    name: string;
    status: ActivityStatus;
    dependencies?: string;
  }[];
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: {
    activityCode: string;
    error: string;
  }[];
}

export interface ActivityOrder {
  id: string;
  orderIndex: number;
}
