export interface TOFEDocument {
  id: string;
  macroFrameworkId: string;
  fiscalYear: number;
  documentCode: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'VALIDATED' | 'APPROVED';
  generatedAt: string;
  createdBy?: string;
  validatedBy?: string;
  validatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  currency: string;
  unit: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  macroFramework?: any;
  lines?: TOFELine[];
  baseYear?: number;
  projectionYear1?: number;
  projectionYear2?: number;
  projectionYear3?: number;
}

export interface TOFELine {
  id: string;
  tofeDocumentId: string;
  section: 'REVENUE' | 'EXPENSE' | 'BALANCE' | 'FINANCING';
  lineCode: string;
  lineLabel: string;
  lineLevel: number;
  parentLineId?: string;
  orderIndex: number;
  baseYear: number;
  baseAmount: string | number;
  projectionYear1: number;
  amount1: string | number;
  projectionYear2: number;
  amount2: string | number;
  projectionYear3?: number;
  amount3?: string | number;
  isCalculated: boolean;
  isBold: boolean;
  accountCode?: string;
  gfsCode?: string;
  formula?: string;
  notes?: string;
}

export interface CreateTOFEDocumentDto {
  macroFrameworkId: string;
  fiscalYear: number;
  documentCode: string;
  title: string;
  description?: string;
  currency?: string;
  unit?: string;
  notes?: string;
}

export interface UpdateTOFEDocumentDto {
  documentCode?: string;
  title?: string;
  description?: string;
  currency?: string;
  unit?: string;
  notes?: string;
  status?: string;
}

export interface CreateTOFELineDto {
  tofeDocumentId: string;
  section: string;
  lineCode: string;
  lineLabel: string;
  lineLevel?: number;
  parentLineId?: string;
  orderIndex: number;
  baseYear: number;
  baseAmount?: number;
  projectionYear1: number;
  amount1?: number;
  projectionYear2: number;
  amount2?: number;
  projectionYear3?: number;
  amount3?: number;
  isCalculated?: boolean;
  isBold?: boolean;
  accountCode?: string;
  gfsCode?: string;
  formula?: string;
  notes?: string;
}

export interface FiscalBalance {
  year: number;
  totalRevenue: string;
  totalExpense: string;
  balance: string;
  balanceRatio: string;
  isSurplus: boolean;
  isDeficit: boolean;
  isBalanced: boolean;
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  errors: string[];
  warnings: string[];
}

export interface BudgetRatio {
  year: number;
  revenueGrowth: string;
  expenseGrowth: string;
  expenseToRevenueRatio: string;
  balanceToRevenueRatio: string;
  isSurplus: boolean;
  isDeficit: boolean;
}

// Ratios par rapport au PIB
export interface GDPRatio {
  year: number;
  nominalGDP: string;
  revenueToGDP: string;
  expenseToGDP: string;
  balanceToGDP: string;
  primaryBalanceToGDP: string;
  interestToGDP: string;
  taxPressure: string;
}

// Solde primaire
export interface PrimaryBalanceYear {
  year: number;
  globalBalance: string;
  primaryBalance: string;
  interest: string;
}

export interface PrimaryBalance {
  baseYear: PrimaryBalanceYear;
  year1: PrimaryBalanceYear;
  year2: PrimaryBalanceYear;
  year3: PrimaryBalanceYear | null;
}

// Hypothèses macroéconomiques
export interface MacroHypotheses {
  gdpGrowthRate?: string;
  inflationRate?: string;
  exchangeRate?: string;
  nominalGDP?: string;
  nominalGDPYear1?: string;
  nominalGDPYear2?: string;
  nominalGDPYear3?: string;
  oilPrice?: string;
  interestRate?: string;
}

export interface TOFESummary {
  document: {
    id: string;
    code: string;
    title: string;
    fiscalYear: number;
    status: string;
    currency: string;
    unit: string;
  };
  macroHypotheses: MacroHypotheses | null;
  balances: Array<{
    year: number;
    revenue: string;
    expense: string;
    balance: string;
    balanceRatio: string;
    type: 'SURPLUS' | 'DEFICIT' | 'BALANCED';
  }>;
  primaryBalance: PrimaryBalance | null;
  ratios: BudgetRatio[];
  gdpRatios: GDPRatio[];
  revenueBreakdown: Array<{
    code: string;
    label: string;
    baseAmount: string;
    amount1: string;
    amount2: string;
    amount3?: string;
  }>;
  expenseBreakdown: Array<{
    code: string;
    label: string;
    baseAmount: string;
    amount1: string;
    amount2: string;
    amount3?: string;
  }>;
  balanceBreakdown: Array<{
    code: string;
    label: string;
    gfsCode?: string;
    baseAmount: string;
    amount1: string;
    amount2: string;
    amount3?: string;
    formula?: string;
    notes?: string;
  }>;
  consistency: ConsistencyCheck;
}

export interface TOFEFilters {
  macroFrameworkId?: string;
  fiscalYear?: number;
  status?: string;
  page?: number;
  limit?: number;
}
