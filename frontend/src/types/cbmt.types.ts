// Types de scénarios CBMT (REQ-CBMT-03)
export type ScenarioType = 'BASE' | 'OPTIMISTIC' | 'PESSIMISTIC' | 'REALISTIC' | 'CUSTOM';

export interface CBMTDocument {
  id: string;
  macroFrameworkId: string;
  fiscalYear: number;
  documentCode: string;
  title: string;
  description?: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  // Scénarios multiples (REQ-CBMT-03)
  parentScenarioId?: string;
  gdpGrowthVariation?: number;
  inflationVariation?: number;
  revenueAdjustment?: number;
  expenseAdjustment?: number;
  isBaseScenario: boolean;
  // Plafonds
  totalRevenueCeiling: number;
  totalExpenseCeiling: number;
  fiscalDeficitCeiling?: number;
  debtCeiling?: number;
  status: string;
  generatedAt: Date;
  createdBy?: string;
  validatedBy?: string;
  validatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  currency: string;
  unit: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  macroFramework?: any;
  parentScenario?: CBMTDocument;
  childScenarios?: CBMTDocument[];
  aggregates?: CBMTAggregate[];
  reserves?: CBMTReserve[];
  analyses?: CBMTAnalysis[];
}

export interface CBMTAggregate {
  id: string;
  cbmtDocumentId: string;
  aggregateType: string; // REVENUE, EXPENSE
  economicNatureId?: string;
  categoryCode: string;
  categoryName: string;
  baseYear: number;
  baseAmount: number;
  year1: number;
  amount1: number;
  ceiling1?: number;
  gap1?: number;
  year2: number;
  amount2: number;
  ceiling2?: number;
  gap2?: number;
  year3: number;
  amount3: number;
  ceiling3?: number;
  gap3?: number;
  calculationMethod: string;
  isAlertTriggered: boolean;
  alertMessage?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types de réserves CBMT (REQ-CBMT-02)
export type ReserveType = 'CONTINGENCY' | 'ARBITRAGE' | 'OTHER';

export interface CBMTReserve {
  id: string;
  cbmtDocumentId: string;
  reserveType: ReserveType;
  name: string;
  description?: string;
  year1: number;
  amount1: number;
  allocated1: number;
  available1: number;
  year2: number;
  amount2: number;
  allocated2: number;
  available2: number;
  year3: number;
  amount3: number;
  allocated3: number;
  available3: number;
  calculationBasis?: string;
  // Paramètres de calcul automatique (REQ-CBMT-02)
  percentageOfTotal?: number;
  referenceAggregate?: string;
  isAutoCalculated: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CBMTAnalysis {
  id: string;
  cbmtDocumentId: string;
  analysisType: string; // SENSITIVITY, GAP, SHOCK, SUSTAINABILITY
  analysisName: string;
  description?: string;
  parameters?: any;
  results: any;
  keyIndicators?: any;
  conclusions?: string;
  recommendations?: string;
  riskLevel?: string;
  calculatedAt: Date;
  calculatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCBMTDocumentDto {
  macroFrameworkId: string;
  fiscalYear: number;
  documentCode: string;
  title: string;
  description?: string;
  scenarioName?: string;
  scenarioType?: ScenarioType;
  // Scénarios multiples (REQ-CBMT-03)
  parentScenarioId?: string;
  gdpGrowthVariation?: number;
  inflationVariation?: number;
  revenueAdjustment?: number;
  expenseAdjustment?: number;
  // Plafonds
  totalRevenueCeiling: number;
  totalExpenseCeiling: number;
  fiscalDeficitCeiling?: number;
  debtCeiling?: number;
  currency?: string;
  unit?: string;
  notes?: string;
}

export interface UpdateCBMTDocumentDto {
  documentCode?: string;
  title?: string;
  description?: string;
  scenarioName?: string;
  scenarioType?: ScenarioType;
  gdpGrowthVariation?: number;
  inflationVariation?: number;
  revenueAdjustment?: number;
  expenseAdjustment?: number;
  totalRevenueCeiling?: number;
  totalExpenseCeiling?: number;
  fiscalDeficitCeiling?: number;
  debtCeiling?: number;
  currency?: string;
  unit?: string;
  notes?: string;
  status?: string;
}

export interface CreateCBMTAggregateDto {
  cbmtDocumentId: string;
  aggregateType: string;
  economicNatureId?: string;
  categoryCode: string;
  categoryName: string;
  baseYear: number;
  baseAmount?: number;
  year1: number;
  amount1?: number;
  ceiling1?: number;
  year2: number;
  amount2?: number;
  ceiling2?: number;
  year3: number;
  amount3?: number;
  ceiling3?: number;
  calculationMethod?: string;
  notes?: string;
}

export interface CreateCBMTReserveDto {
  cbmtDocumentId: string;
  reserveType: ReserveType;
  name: string;
  description?: string;
  year1: number;
  amount1?: number;
  year2: number;
  amount2?: number;
  year3: number;
  amount3?: number;
  calculationBasis?: string;
  // Paramètres de calcul automatique (REQ-CBMT-02)
  percentageOfTotal?: number;
  referenceAggregate?: string;
  isAutoCalculated?: boolean;
  notes?: string;
}

export interface GapAnalysisResult {
  year: number;
  totalRevenue: number;
  totalRevenueProjected: number;
  totalRevenueCeiling: number;
  revenueGap: number;
  revenueGapPercentage: number;
  totalExpense: number;
  totalExpenseProjected: number;
  totalExpenseCeiling: number;
  expenseGap: number;
  expenseGapPercentage: number;
  fiscalBalance: number;
  hasOverrun: boolean;
}

export interface CeilingSummary {
  aggregateType: string;
  categoryCode: string;
  categoryName: string;
  year: number;
  amount: number;
  ceiling: number;
  gap: number;
  gapPercentage: number;
  isOverrun: boolean;
  riskLevel: string;
}

export interface BudgetSummary {
  year: number;
  revenues: {
    total: number;
    ceiling: number;
    gap: number;
    gapPercentage: number;
    byCategory: CeilingSummary[];
  };
  expenses: {
    total: number;
    ceiling: number;
    gap: number;
    gapPercentage: number;
    byCategory: CeilingSummary[];
  };
  balance: {
    actual: number;
    planned: number;
    gap: number;
  };
  reserves: {
    total: number;
    allocated: number;
    available: number;
    utilizationRate: number;
  };
}

export interface SensitivityAnalysisParams {
  gdpGrowthVariation?: number;
  inflationVariation?: number;
}

export interface ShockSimulationParams {
  shockType: string; // REVENUE_SHOCK, EXPENSE_SHOCK, COMBINED_SHOCK
  magnitude: number;
  duration: number;
}

export interface SensitivityResult {
  scenario: string;
  gdpGrowthRate: number;
  inflationRate: number;
  years: Array<{
    year: number;
    totalRevenue: number;
    totalExpense: number;
    fiscalBalance: number;
    revenueChange: number;
    expenseChange: number;
    balanceChange: number;
  }>;
  averageImpact: {
    revenueChange: number;
    expenseChange: number;
    balanceChange: number;
  };
  riskLevel: string;
}

export interface ShockSimulationResult {
  shockType: string;
  magnitude: number;
  duration: number;
  years: Array<{
    year: number;
    baselineRevenue: number;
    shockedRevenue: number;
    baselineExpense: number;
    shockedExpense: number;
    baselineBalance: number;
    shockedBalance: number;
    revenueImpact: number;
    expenseImpact: number;
    balanceImpact: number;
  }>;
  recoveryTime: number | null;
  cumulativeImpact: number;
  riskLevel: string;
}

export interface SustainabilityRatios {
  year: number;
  debtToGDPRatio: number;
  fiscalBalanceToGDPRatio: number;
  revenueToGDPRatio: number;
  expenseToGDPRatio: number;
  debtServiceToRevenueRatio: number;
  primaryBalanceToGDPRatio: number;
  sustainabilityScore: number;
  isSustainable: boolean;
  warnings: string[];
}

export interface OverrunAlert {
  aggregateId: string;
  aggregateType: string;
  categoryCode: string;
  categoryName: string;
  year: number;
  amount: number;
  ceiling: number;
  gap: number;
  gapPercentage: number;
  riskLevel: string;
  message: string;
}

// ============================================
// CBMT-TOFE RECONCILIATION TYPES (REQ-CBMT-02)
// ============================================

export type ReconciliationAlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface ReconciliationAlert {
  type: 'REVENUE_MISMATCH' | 'EXPENSE_MISMATCH' | 'BALANCE_INCONSISTENCY' | 'CEILING_EXCEEDED' | 'RESERVE_INSUFFICIENT';
  level: ReconciliationAlertLevel;
  year: number;
  cbmtValue: number;
  tofeValue: number;
  difference: number;
  differencePercent: number;
  message: string;
  recommendation: string;
}

export interface ReconciliationYear {
  year: number;
  cbmtRevenue: number;
  tofeRevenue: number;
  revenueMatch: boolean;
  revenueDifference: number;
  revenueDifferencePercent: number;
  cbmtExpense: number;
  tofeExpense: number;
  expenseMatch: boolean;
  expenseDifference: number;
  expenseDifferencePercent: number;
  cbmtBalance: number;
  tofeBalance: number;
  balanceMatch: boolean;
  balanceDifference: number;
}

export interface ReconciliationResult {
  cbmtDocumentId: string;
  tofeDocumentId: string;
  macroFrameworkId: string;
  fiscalYear: number;
  reconciliationDate: string;
  isReconciled: boolean;
  years: ReconciliationYear[];
  alerts: ReconciliationAlert[];
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    infoAlerts: number;
    overallStatus: 'RECONCILED' | 'PARTIAL' | 'FAILED';
    recommendations: string[];
  };
}

export interface SynchronizationResult {
  success: boolean;
  cbmtDocumentId: string;
  tofeDocumentId: string;
  syncDirection: 'CBMT_TO_TOFE' | 'TOFE_TO_CBMT';
  updatedFields: string[];
  previousValues: Record<string, number>;
  newValues: Record<string, number>;
  message: string;
}

export interface ValidationBeforeApproval {
  canValidate: boolean;
  errors: string[];
  warnings: string[];
  reconciliationStatus: 'RECONCILED' | 'PARTIAL' | 'FAILED' | 'NOT_FOUND';
  lastReconciliationDate?: string;
}

// ============================================
// SCENARIO COMPARISON TYPES (REQ-CBMT-03)
// ============================================

export interface ScenarioYearData {
  year: number;
  totalRevenue: number;
  totalExpense: number;
  fiscalBalance: number;
  fiscalDeficitCeiling?: number;
  debtCeiling?: number;
}

export interface ScenarioData {
  id: string;
  scenarioType: ScenarioType;
  scenarioName: string;
  isBaseScenario: boolean;
  gdpGrowthVariation?: number;
  inflationVariation?: number;
  revenueAdjustment?: number;
  expenseAdjustment?: number;
  years: ScenarioYearData[];
}

export interface ScenarioVariance {
  scenarioId: string;
  scenarioType: ScenarioType;
  scenarioName: string;
  years: Array<{
    year: number;
    revenueVariance: number;
    revenueVariancePercent: number;
    expenseVariance: number;
    expenseVariancePercent: number;
    balanceVariance: number;
    balanceVariancePercent: number;
  }>;
}

export interface ScenarioComparisonResult {
  baseScenario: ScenarioData;
  alternativeScenarios: ScenarioData[];
  variances: ScenarioVariance[];
  summary: {
    bestCaseScenario: string;
    worstCaseScenario: string;
    averageRevenueVariance: number;
    averageExpenseVariance: number;
    averageBalanceVariance: number;
    maxRevenueImpact: number;
    maxExpenseImpact: number;
    maxBalanceImpact: number;
    riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface CreateScenarioDto {
  parentScenarioId: string;
  scenarioType: ScenarioType;
  scenarioName: string;
  gdpGrowthVariation?: number;
  inflationVariation?: number;
  revenueAdjustment?: number;
  expenseAdjustment?: number;
  customParameters?: Record<string, number>;
}

export interface ScenarioFilters {
  macroFrameworkId?: string;
  fiscalYear?: number;
  scenarioType?: ScenarioType;
  status?: string;
  isBaseScenario?: boolean;
}
