// ============================================
// MACRO FRAMEWORK TYPES
// ============================================

export interface MacroFramework {
  id: string;
  year: number;
  budgetYear: number;
  gdpGrowthRate: number;
  inflationRate: number;
  exchangeRate?: number;
  agricultureGrowthRate: number;
  industryGrowthRate: number;
  servicesGrowthRate: number;
  // Prix des matières premières
  oilPrice?: number;
  oilPriceYear1?: number;
  oilPriceYear2?: number;
  oilPriceYear3?: number;
  goldPrice?: number;
  goldPriceYear1?: number;
  goldPriceYear2?: number;
  goldPriceYear3?: number;
  foodPriceIndex?: number;
  foodPriceIndexYear1?: number;
  foodPriceIndexYear2?: number;
  foodPriceIndexYear3?: number;
  // PIB nominal pour ratios
  nominalGDP?: number;
  nominalGDPYear1?: number;
  nominalGDPYear2?: number;
  nominalGDPYear3?: number;
  // Taux d'intérêt
  interestRate?: number;
  // Workflow
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VALIDATED' | 'APPROVED' | 'REJECTED';
  workflowStage?: string;
  createdBy?: string;
  submittedAt?: string;
  submittedBy?: string;
  validatedBy?: string;
  validatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  revenueProjections?: RevenueProjection[];
  expenseProjections?: ExpenseProjection[];
}

export interface CreateMacroFrameworkDto {
  year: number;
  budgetYear: number;
  gdpGrowthRate: number;
  inflationRate: number;
  exchangeRate?: number;
  agricultureGrowthRate?: number;
  industryGrowthRate?: number;
  servicesGrowthRate?: number;
  // Prix des matières premières
  oilPrice?: number;
  oilPriceYear1?: number;
  oilPriceYear2?: number;
  oilPriceYear3?: number;
  goldPrice?: number;
  goldPriceYear1?: number;
  goldPriceYear2?: number;
  goldPriceYear3?: number;
  foodPriceIndex?: number;
  foodPriceIndexYear1?: number;
  foodPriceIndexYear2?: number;
  foodPriceIndexYear3?: number;
  // PIB nominal pour ratios
  nominalGDP?: number;
  nominalGDPYear1?: number;
  nominalGDPYear2?: number;
  nominalGDPYear3?: number;
  // Taux d'intérêt
  interestRate?: number;
}

export interface UpdateMacroFrameworkDto {
  year?: number;
  budgetYear?: number;
  gdpGrowthRate?: number;
  inflationRate?: number;
  exchangeRate?: number;
  agricultureGrowthRate?: number;
  industryGrowthRate?: number;
  servicesGrowthRate?: number;
  // Prix des matières premières
  oilPrice?: number;
  oilPriceYear1?: number;
  oilPriceYear2?: number;
  oilPriceYear3?: number;
  goldPrice?: number;
  goldPriceYear1?: number;
  goldPriceYear2?: number;
  goldPriceYear3?: number;
  foodPriceIndex?: number;
  foodPriceIndexYear1?: number;
  foodPriceIndexYear2?: number;
  foodPriceIndexYear3?: number;
  // PIB nominal pour ratios
  nominalGDP?: number;
  nominalGDPYear1?: number;
  nominalGDPYear2?: number;
  nominalGDPYear3?: number;
  // Taux d'intérêt
  interestRate?: number;
}

// ============================================
// REVENUE PROJECTION TYPES
// ============================================

export interface RevenueProjection {
  id: string;
  macroFrameworkId: string;
  revenueType: 'TAX' | 'NON_TAX' | 'GRANTS' | 'OTHER';
  categoryCode: string;
  categoryName: string;
  baseYear: number;
  baseAmount: number;
  projectionYear1: number;
  projectedAmount1: number;
  growthRate1?: number;
  adjustmentFactor1?: number;
  projectionYear2: number;
  projectedAmount2: number;
  growthRate2?: number;
  adjustmentFactor2?: number;
  projectionYear3?: number;
  projectedAmount3?: number;
  growthRate3?: number;
  adjustmentFactor3?: number;
  calculationMethod: 'AUTO' | 'MANUAL' | 'HYBRID';
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  macroFramework?: MacroFramework;
}

export interface CreateRevenueProjectionDto {
  macroFrameworkId: string;
  revenueType: 'TAX' | 'NON_TAX' | 'GRANTS' | 'OTHER';
  categoryCode: string;
  categoryName: string;
  baseYear: number;
  baseAmount: number;
  projectionYear1: number;
  projectedAmount1?: number;
  growthRate1?: number;
  adjustmentFactor1?: number;
  projectionYear2: number;
  projectedAmount2?: number;
  growthRate2?: number;
  adjustmentFactor2?: number;
  projectionYear3?: number;
  projectedAmount3?: number;
  growthRate3?: number;
  adjustmentFactor3?: number;
  calculationMethod?: 'AUTO' | 'MANUAL' | 'HYBRID';
  notes?: string;
}

export interface UpdateRevenueProjectionDto {
  revenueType?: 'TAX' | 'NON_TAX' | 'GRANTS' | 'OTHER';
  categoryCode?: string;
  categoryName?: string;
  baseYear?: number;
  baseAmount?: number;
  projectionYear1?: number;
  projectedAmount1?: number;
  growthRate1?: number;
  adjustmentFactor1?: number;
  projectionYear2?: number;
  projectedAmount2?: number;
  growthRate2?: number;
  adjustmentFactor2?: number;
  projectionYear3?: number;
  projectedAmount3?: number;
  growthRate3?: number;
  adjustmentFactor3?: number;
  calculationMethod?: 'AUTO' | 'MANUAL' | 'HYBRID';
  notes?: string;
  isActive?: boolean;
}

// ============================================
// EXPENSE PROJECTION TYPES
// ============================================

export type ExpenseType =
  | 'PERSONNEL'
  | 'GOODS_SERVICES'
  | 'DEBT_INTEREST'
  | 'DEBT_SERVICE'
  | 'TRANSFERS'
  | 'SUBSIDIES'
  | 'INVESTMENT'
  | 'OTHER';

export interface ExpenseProjection {
  id: string;
  macroFrameworkId: string;
  expenseType: ExpenseType;
  categoryCode: string;
  categoryName: string;
  ministryId?: string;
  isInterest: boolean; // Pour le calcul du solde primaire
  baseYear: number;
  baseAmount: number;
  projectionYear1: number;
  projectedAmount1: number;
  growthRate1?: number;
  adjustmentFactor1?: number;
  projectionYear2: number;
  projectedAmount2: number;
  growthRate2?: number;
  adjustmentFactor2?: number;
  projectionYear3?: number;
  projectedAmount3?: number;
  growthRate3?: number;
  adjustmentFactor3?: number;
  calculationMethod: 'AUTO' | 'MANUAL' | 'HYBRID';
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  macroFramework?: MacroFramework;
  ministry?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface CreateExpenseProjectionDto {
  macroFrameworkId: string;
  expenseType: ExpenseType;
  categoryCode: string;
  categoryName: string;
  ministryId?: string;
  isInterest?: boolean;
  baseYear: number;
  baseAmount: number;
  projectionYear1: number;
  projectedAmount1?: number;
  growthRate1?: number;
  adjustmentFactor1?: number;
  projectionYear2: number;
  projectedAmount2?: number;
  growthRate2?: number;
  adjustmentFactor2?: number;
  projectionYear3?: number;
  projectedAmount3?: number;
  growthRate3?: number;
  adjustmentFactor3?: number;
  calculationMethod?: 'AUTO' | 'MANUAL' | 'HYBRID';
  notes?: string;
}

export interface UpdateExpenseProjectionDto {
  expenseType?: ExpenseType;
  categoryCode?: string;
  categoryName?: string;
  ministryId?: string;
  isInterest?: boolean;
  baseYear?: number;
  baseAmount?: number;
  projectionYear1?: number;
  projectedAmount1?: number;
  growthRate1?: number;
  adjustmentFactor1?: number;
  projectionYear2?: number;
  projectedAmount2?: number;
  growthRate2?: number;
  adjustmentFactor2?: number;
  projectionYear3?: number;
  projectedAmount3?: number;
  growthRate3?: number;
  adjustmentFactor3?: number;
  calculationMethod?: 'AUTO' | 'MANUAL' | 'HYBRID';
  notes?: string;
  isActive?: boolean;
}

// ============================================
// SUMMARY & ANALYSIS TYPES
// ============================================

export interface ProjectionSummary {
  byType: Record<string, {
    base: number;
    year1: number;
    year2: number;
    year3: number;
  }>;
  byYear: {
    base: number;
    year1: number;
    year2: number;
    year3: number;
  };
  total: {
    base: number;
    year1: number;
    year2: number;
    year3: number;
  };
}

export interface FiscalBalance {
  revenues: {
    base: number;
    year1: number;
    year2: number;
    year3: number;
  };
  expenses: {
    base: number;
    year1: number;
    year2: number;
    year3: number;
  };
  balance: {
    base: number;
    year1: number;
    year2: number;
    year3: number;
  };
  balanceToRevenueRatio: {
    base: number;
    year1: number;
    year2: number;
    year3: number;
  };
  isSurplus: {
    base: boolean;
    year1: boolean;
    year2: boolean;
    year3: boolean;
  };
  isDeficitConcerning: {
    base: boolean;
    year1: boolean;
    year2: boolean;
    year3: boolean;
  };
}

export interface CoherenceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  balance: {
    balance: number;
    balanceToRevenueRatio: number;
    isSurplus: boolean;
    isDeficit: boolean;
    isBalanced: boolean;
    isDeficitConcerning: boolean;
  };
  stats: {
    revenueProjectionsCount: number;
    expenseProjectionsCount: number;
    totalRevenue: number;
    totalExpense: number;
  };
}

export interface GlobalStats {
  macroFramework: {
    id: string;
    year: number;
    budgetYear: number;
    gdpGrowthRate: number;
    inflationRate: number;
    status: string;
  };
  revenues: {
    byYear: {
      base: number;
      year1: number;
      year2: number;
      year3: number;
    };
    growthRates: {
      year1: number;
      year2: number;
      year3: number;
    };
    count: number;
  };
  expenses: {
    byYear: {
      base: number;
      year1: number;
      year2: number;
      year3: number;
    };
    growthRates: {
      year1: number;
      year2: number;
      year3: number;
    };
    count: number;
  };
  balance: {
    byYear: Record<string, {
      balance: number;
      balanceToRevenueRatio: number;
      isSurplus: boolean;
      isDeficit: boolean;
      isBalanced: boolean;
      isDeficitConcerning: boolean;
    }>;
  };
}
