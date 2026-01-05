import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// ============================================================================
// REQ-GLOB-01: Enhanced Trend Budget Calculation by Ministry
// ============================================================================

interface TemporaryExpenseIdentification {
  budgetId: string;
  ministryId: string;
  ministryName: string;
  fiscalYear: number;
  amount: number;
  isTemporary: boolean;
  temporaryType?: 'ONE_TIME' | 'PROJECT_BASED' | 'EXCEPTIONAL' | 'SUNSET';
  expirationYear?: number;
  notes?: string;
}

interface TrendGrowthHypothesis {
  category: string; // 'PERSONNEL' | 'GOODS_SERVICES' | 'TRANSFERS' | 'INVESTMENT'
  defaultRate: number;
  priorityRate: number; // Higher rate for priority ministries
  nonPriorityRate: number;
  description: string;
}

interface MinistryTrendBudget {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  isPriority: boolean;
  baselineY0: number;
  temporaryExcluded: number;
  adjustedBaseline: number;
  trendY1: number;
  trendY2: number;
  trendY3: number;
  growthRateApplied: number;
  categoryBreakdown: {
    category: string;
    baseAmount: number;
    trendY1: number;
    trendY2: number;
    trendY3: number;
    growthRate: number;
  }[];
}

export class CDMTGlobalEnhancedService {
  // ============================================================================
  // REQ-GLOB-01: Trend Budget Calculation
  // ============================================================================

  /**
   * Default growth hypotheses by expense category
   */
  static getDefaultGrowthHypotheses(): TrendGrowthHypothesis[] {
    return [
      {
        category: 'PERSONNEL',
        defaultRate: 3.5,
        priorityRate: 4.0,
        nonPriorityRate: 3.0,
        description: 'Dépenses de personnel (salaires, charges sociales)',
      },
      {
        category: 'GOODS_SERVICES',
        defaultRate: 2.5,
        priorityRate: 3.0,
        nonPriorityRate: 2.0,
        description: 'Biens et services (fonctionnement)',
      },
      {
        category: 'TRANSFERS',
        defaultRate: 2.0,
        priorityRate: 2.5,
        nonPriorityRate: 1.5,
        description: 'Transferts et subventions',
      },
      {
        category: 'INVESTMENT',
        defaultRate: 5.0,
        priorityRate: 7.0,
        nonPriorityRate: 3.0,
        description: 'Investissements (équipements, infrastructures)',
      },
      {
        category: 'DEBT_SERVICE',
        defaultRate: 0.0,
        priorityRate: 0.0,
        nonPriorityRate: 0.0,
        description: 'Service de la dette (croissance fixe ou nulle)',
      },
    ];
  }

  /**
   * Identify and classify temporary expenses
   */
  static async identifyTemporaryExpenses(
    trendConfigId: string
  ): Promise<TemporaryExpenseIdentification[]> {
    const historicalBudgets = await prisma.historicalBudget.findMany({
      where: { trendConfigId },
      include: {
        ministry: { select: { id: true, name: true, code: true } },
      },
    });

    const temporaryExpenses: TemporaryExpenseIdentification[] = [];

    for (const budget of historicalBudgets) {
      if (budget.isTemporary) {
        // Determine temporary type based on notes or patterns
        let temporaryType: 'ONE_TIME' | 'PROJECT_BASED' | 'EXCEPTIONAL' | 'SUNSET' = 'ONE_TIME';

        const notesLower = (budget.notes || '').toLowerCase();
        if (notesLower.includes('projet') || notesLower.includes('project')) {
          temporaryType = 'PROJECT_BASED';
        } else if (notesLower.includes('exceptionnel') || notesLower.includes('exceptional')) {
          temporaryType = 'EXCEPTIONAL';
        } else if (notesLower.includes('sunset') || notesLower.includes('fin de programme')) {
          temporaryType = 'SUNSET';
        }

        temporaryExpenses.push({
          budgetId: budget.id,
          ministryId: budget.ministryId,
          ministryName: budget.ministry.name,
          fiscalYear: budget.fiscalYear,
          amount: parseFloat(budget.budgetAmount.toString()),
          isTemporary: true,
          temporaryType,
          notes: budget.notes || undefined,
        });
      }
    }

    return temporaryExpenses;
  }

  /**
   * Calculate trend budgets by ministry with category breakdown
   * REQ-GLOB-01: Full implementation
   */
  static async calculateTrendBudgetsByMinistry(
    trendConfigId: string,
    customHypotheses?: Partial<TrendGrowthHypothesis>[]
  ): Promise<{
    ministries: MinistryTrendBudget[];
    totals: {
      baselineY0: number;
      temporaryExcluded: number;
      adjustedBaseline: number;
      trendY1: number;
      trendY2: number;
      trendY3: number;
    };
    hypothesesUsed: TrendGrowthHypothesis[];
  }> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration tendancielle non trouvée');
    }

    // Get growth hypotheses
    const hypotheses = this.getDefaultGrowthHypotheses();
    if (customHypotheses) {
      for (const custom of customHypotheses) {
        const idx = hypotheses.findIndex((h) => h.category === custom.category);
        if (idx >= 0) {
          hypotheses[idx] = { ...hypotheses[idx], ...custom };
        }
      }
    }

    // Get all historical budgets
    const historicalBudgets = await prisma.historicalBudget.findMany({
      where: { trendConfigId },
      include: {
        ministry: true,
        economicNature: true,
      },
    });

    // Get all active ministries
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const ministryTrendBudgets: MinistryTrendBudget[] = [];

    for (const ministry of ministries) {
      const ministryBudgets = historicalBudgets.filter(
        (b) => b.ministryId === ministry.id
      );

      if (ministryBudgets.length === 0) continue;

      // Calculate baseline (last year, excluding temporary)
      const regularBudgets = ministryBudgets.filter((b) => !b.isTemporary);
      const temporaryBudgets = ministryBudgets.filter((b) => b.isTemporary);

      const baselineY0 = ministryBudgets.reduce(
        (sum, b) => sum + parseFloat(b.budgetAmount.toString()),
        0
      );
      const temporaryExcluded = temporaryBudgets.reduce(
        (sum, b) => sum + parseFloat(b.budgetAmount.toString()),
        0
      );
      const adjustedBaseline = baselineY0 - temporaryExcluded;

      // Calculate by category
      const categoryBreakdown: MinistryTrendBudget['categoryBreakdown'] = [];

      for (const hypothesis of hypotheses) {
        // Map economic natures to categories
        const categoryBudgets = regularBudgets.filter((b) => {
          const natureCode = b.economicNature?.code || '';
          // Simplified mapping - can be customized
          if (hypothesis.category === 'PERSONNEL') {
            return natureCode.startsWith('1') || natureCode.startsWith('2');
          } else if (hypothesis.category === 'GOODS_SERVICES') {
            return natureCode.startsWith('3') || natureCode.startsWith('4');
          } else if (hypothesis.category === 'TRANSFERS') {
            return natureCode.startsWith('5') || natureCode.startsWith('6');
          } else if (hypothesis.category === 'INVESTMENT') {
            return natureCode.startsWith('7') || natureCode.startsWith('8');
          }
          return false;
        });

        const baseAmount = categoryBudgets.reduce(
          (sum, b) => sum + parseFloat(b.budgetAmount.toString()),
          0
        );

        if (baseAmount > 0) {
          const growthRate = ministry.isPriority
            ? hypothesis.priorityRate
            : hypothesis.nonPriorityRate;

          categoryBreakdown.push({
            category: hypothesis.category,
            baseAmount,
            trendY1: baseAmount * (1 + growthRate / 100),
            trendY2: baseAmount * Math.pow(1 + growthRate / 100, 2),
            trendY3: baseAmount * Math.pow(1 + growthRate / 100, 3),
            growthRate,
          });
        }
      }

      // Calculate totals
      const baseGrowthRate = parseFloat(config.globalGrowthRate.toString());
      const globalGrowthRate = ministry.isPriority
        ? baseGrowthRate * 1.2 // 20% bonus for priority
        : baseGrowthRate;

      const trendY1 =
        categoryBreakdown.length > 0
          ? categoryBreakdown.reduce((sum, c) => sum + c.trendY1, 0)
          : adjustedBaseline * (1 + globalGrowthRate / 100);
      const trendY2 =
        categoryBreakdown.length > 0
          ? categoryBreakdown.reduce((sum, c) => sum + c.trendY2, 0)
          : adjustedBaseline * Math.pow(1 + globalGrowthRate / 100, 2);
      const trendY3 =
        categoryBreakdown.length > 0
          ? categoryBreakdown.reduce((sum, c) => sum + c.trendY3, 0)
          : adjustedBaseline * Math.pow(1 + globalGrowthRate / 100, 3);

      ministryTrendBudgets.push({
        ministryId: ministry.id,
        ministryCode: ministry.code,
        ministryName: ministry.name,
        isPriority: ministry.isPriority,
        baselineY0,
        temporaryExcluded,
        adjustedBaseline,
        trendY1,
        trendY2,
        trendY3,
        growthRateApplied: globalGrowthRate,
        categoryBreakdown,
      });
    }

    // Calculate totals
    const totals = {
      baselineY0: ministryTrendBudgets.reduce((sum, m) => sum + m.baselineY0, 0),
      temporaryExcluded: ministryTrendBudgets.reduce(
        (sum, m) => sum + m.temporaryExcluded,
        0
      ),
      adjustedBaseline: ministryTrendBudgets.reduce(
        (sum, m) => sum + m.adjustedBaseline,
        0
      ),
      trendY1: ministryTrendBudgets.reduce((sum, m) => sum + m.trendY1, 0),
      trendY2: ministryTrendBudgets.reduce((sum, m) => sum + m.trendY2, 0),
      trendY3: ministryTrendBudgets.reduce((sum, m) => sum + m.trendY3, 0),
    };

    return {
      ministries: ministryTrendBudgets,
      totals,
      hypothesesUsed: hypotheses,
    };
  }

  // ============================================================================
  // REQ-GLOB-02: Enhanced Fiscal Margin Calculation
  // ============================================================================

  /**
   * Calculate fiscal margin with category breakdown and resource type separation
   */
  static async calculateEnhancedFiscalMargin(
    macroFrameworkId: string
  ): Promise<{
    totalMargin: { y1: number; y2: number; y3: number };
    byCategory: {
      category: string;
      revenueY1: number;
      revenueY2: number;
      revenueY3: number;
      expenseY1: number;
      expenseY2: number;
      expenseY3: number;
      marginY1: number;
      marginY2: number;
      marginY3: number;
    }[];
    byResourceType: {
      type: 'INTERNAL' | 'EXTERNAL';
      revenueY1: number;
      revenueY2: number;
      revenueY3: number;
      marginY1: number;
      marginY2: number;
      marginY3: number;
    }[];
    reserves: {
      type: string;
      amountY1: number;
      amountY2: number;
      amountY3: number;
    }[];
    netMarginAfterReserves: { y1: number; y2: number; y3: number };
  }> {
    const framework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
    });

    if (!framework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Get revenue projections
    const revenueProjections = await prisma.revenueProjection.findMany({
      where: { macroFrameworkId },
    });

    // Get expense projections
    const expenseProjections = await prisma.expenseProjection.findMany({
      where: { macroFrameworkId },
    });

    // Category breakdown calculation
    const categoryMap = new Map<
      string,
      {
        revenueY1: number;
        revenueY2: number;
        revenueY3: number;
        expenseY1: number;
        expenseY2: number;
        expenseY3: number;
      }
    >();

    // Process expense projections by category
    for (const exp of expenseProjections) {
      const categoryName = exp.categoryName || 'AUTRES';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          revenueY1: 0, revenueY2: 0, revenueY3: 0,
          expenseY1: 0, expenseY2: 0, expenseY3: 0,
        });
      }

      const cat = categoryMap.get(categoryName)!;
      cat.expenseY1 += parseFloat((exp as any).projectedAmount1?.toString() || (exp as any).amount1?.toString() || '0');
      cat.expenseY2 += parseFloat((exp as any).projectedAmount2?.toString() || (exp as any).amount2?.toString() || '0');
      cat.expenseY3 += parseFloat((exp as any).projectedAmount3?.toString() || (exp as any).amount3?.toString() || '0');
    }

    // Calculate by category
    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
      marginY1: data.revenueY1 - data.expenseY1,
      marginY2: data.revenueY2 - data.expenseY2,
      marginY3: data.revenueY3 - data.expenseY3,
    }));

    // Resource type separation (internal vs external)
    const internalRevenues = { y1: 0, y2: 0, y3: 0 };
    const externalRevenues = { y1: 0, y2: 0, y3: 0 };

    for (const rev of revenueProjections) {
      // External = GRANTS (subventions externes) or if categoryName contains 'externe'
      const isExternal =
        rev.revenueType === 'GRANTS' ||
        rev.categoryName?.toLowerCase().includes('externe') ||
        rev.categoryName?.toLowerCase().includes('external');

      const amount1 = parseFloat((rev as any).projectedAmount1?.toString() || (rev as any).amount1?.toString() || '0');
      const amount2 = parseFloat((rev as any).projectedAmount2?.toString() || (rev as any).amount2?.toString() || '0');
      const amount3 = parseFloat((rev as any).projectedAmount3?.toString() || (rev as any).amount3?.toString() || '0');

      if (isExternal) {
        externalRevenues.y1 += amount1;
        externalRevenues.y2 += amount2;
        externalRevenues.y3 += amount3;
      } else {
        internalRevenues.y1 += amount1;
        internalRevenues.y2 += amount2;
        internalRevenues.y3 += amount3;
      }
    }

    // Calculate total revenues and expenses
    const totalRevenueY1 = internalRevenues.y1 + externalRevenues.y1;
    const totalRevenueY2 = internalRevenues.y2 + externalRevenues.y2;
    const totalRevenueY3 = internalRevenues.y3 + externalRevenues.y3;

    const totalExpenseY1 = byCategory.reduce((sum, c) => sum + c.expenseY1, 0);
    const totalExpenseY2 = byCategory.reduce((sum, c) => sum + c.expenseY2, 0);
    const totalExpenseY3 = byCategory.reduce((sum, c) => sum + c.expenseY3, 0);

    const totalMargin = {
      y1: totalRevenueY1 - totalExpenseY1,
      y2: totalRevenueY2 - totalExpenseY2,
      y3: totalRevenueY3 - totalExpenseY3,
    };

    // Get reserves from CBMT if available
    const reserves: { type: string; amountY1: number; amountY2: number; amountY3: number }[] = [];

    // Look for CBMT reserves
    const cbmtReserves = await prisma.cBMTReserve.findMany({
      where: {
        cbmtDocument: {
          macroFrameworkId,
        },
      },
    });

    for (const reserve of cbmtReserves) {
      reserves.push({
        type: reserve.reserveType,
        amountY1: parseFloat(reserve.amount1.toString()),
        amountY2: parseFloat(reserve.amount2.toString()),
        amountY3: parseFloat(reserve.amount3.toString()),
      });
    }

    // Calculate net margin after reserves
    const totalReservesY1 = reserves.reduce((sum, r) => sum + r.amountY1, 0);
    const totalReservesY2 = reserves.reduce((sum, r) => sum + r.amountY2, 0);
    const totalReservesY3 = reserves.reduce((sum, r) => sum + r.amountY3, 0);

    return {
      totalMargin,
      byCategory,
      byResourceType: [
        {
          type: 'INTERNAL',
          revenueY1: internalRevenues.y1,
          revenueY2: internalRevenues.y2,
          revenueY3: internalRevenues.y3,
          marginY1: internalRevenues.y1 - totalExpenseY1 * (internalRevenues.y1 / (totalRevenueY1 || 1)),
          marginY2: internalRevenues.y2 - totalExpenseY2 * (internalRevenues.y2 / (totalRevenueY2 || 1)),
          marginY3: internalRevenues.y3 - totalExpenseY3 * (internalRevenues.y3 / (totalRevenueY3 || 1)),
        },
        {
          type: 'EXTERNAL',
          revenueY1: externalRevenues.y1,
          revenueY2: externalRevenues.y2,
          revenueY3: externalRevenues.y3,
          marginY1: externalRevenues.y1 - totalExpenseY1 * (externalRevenues.y1 / (totalRevenueY1 || 1)),
          marginY2: externalRevenues.y2 - totalExpenseY2 * (externalRevenues.y2 / (totalRevenueY2 || 1)),
          marginY3: externalRevenues.y3 - totalExpenseY3 * (externalRevenues.y3 / (totalRevenueY3 || 1)),
        },
      ],
      reserves,
      netMarginAfterReserves: {
        y1: totalMargin.y1 - totalReservesY1,
        y2: totalMargin.y2 - totalReservesY2,
        y3: totalMargin.y3 - totalReservesY3,
      },
    };
  }

  // ============================================================================
  // REQ-GLOB-03: Central New Measures Management
  // ============================================================================

  /**
   * Create a policy measure with full traceability
   */
  static async createPolicyMeasureWithTraceability(data: {
    scenarioId: string;
    ministryId: string;
    measureCode?: string;
    measureName: string;
    description?: string;
    category: 'PERSONNEL' | 'GOODS_SERVICES' | 'TRANSFERS' | 'INVESTMENT' | 'OTHER';
    amountY1: number;
    amountY2: number;
    amountY3: number;
    justification: string;
    decisionReference?: string;
    decisionDate?: Date;
    source: 'GOVERNMENT_PRIORITY' | 'MINISTRY_REQUEST' | 'LEGAL_OBLIGATION' | 'OTHER';
    createdBy: string;
  }): Promise<any> {
    // Validate scenario exists and can accept new measures
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: data.scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (scenario.status === 'ACTIVE' || scenario.status === 'ARCHIVED') {
      throw new BadRequestError('Impossible d\'ajouter des mesures à un scénario actif ou archivé');
    }

    // Check margin impact
    const marginValidation = await this.validateMeasureMarginImpact(
      data.scenarioId,
      data.amountY1,
      data.amountY2,
      data.amountY3
    );

    // Generate measure code if not provided
    const measureCode = data.measureCode || `MES-${Date.now().toString(36).toUpperCase()}`;

    // Create the measure with full audit trail
    const measure = await prisma.policyMeasure.create({
      data: {
        scenarioId: data.scenarioId,
        ministryId: data.ministryId,
        measureCode,
        measureName: data.measureName,
        description: data.description,
        category: data.category,
        amountY1: data.amountY1,
        amountY2: data.amountY2,
        amountY3: data.amountY3,
        justification: `${data.justification}\n\n[Source: ${data.source}]${data.decisionReference ? `\n[Référence: ${data.decisionReference}]` : ''}`,
        source: data.source,
        status: 'DRAFT',
        createdBy: data.createdBy,
      },
      include: {
        ministry: true,
      },
    });

    return {
      measure,
      marginImpact: marginValidation,
    };
  }

  /**
   * Validate margin impact of a new measure
   */
  static async validateMeasureMarginImpact(
    scenarioId: string,
    amountY1: number,
    amountY2: number,
    amountY3: number
  ): Promise<{
    canAccept: boolean;
    marginBeforeY1: number;
    marginBeforeY2: number;
    marginBeforeY3: number;
    marginAfterY1: number;
    marginAfterY2: number;
    marginAfterY3: number;
    warnings: string[];
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario non trouvé');
    }

    // Get current total measures
    const currentMeasures = await prisma.policyMeasure.findMany({
      where: { scenarioId },
    });

    const currentTotalY1 = currentMeasures.reduce(
      (sum, m) => sum + parseFloat(m.amountY1.toString()),
      0
    );
    const currentTotalY2 = currentMeasures.reduce(
      (sum, m) => sum + parseFloat(m.amountY2.toString()),
      0
    );
    const currentTotalY3 = currentMeasures.reduce(
      (sum, m) => sum + parseFloat(m.amountY3.toString()),
      0
    );

    const fiscalMarginY1 = parseFloat(scenario.fiscalMarginY1.toString());
    const fiscalMarginY2 = parseFloat(scenario.fiscalMarginY2.toString());
    const fiscalMarginY3 = parseFloat(scenario.fiscalMarginY3.toString());

    const marginBeforeY1 = fiscalMarginY1 - currentTotalY1;
    const marginBeforeY2 = fiscalMarginY2 - currentTotalY2;
    const marginBeforeY3 = fiscalMarginY3 - currentTotalY3;

    const marginAfterY1 = marginBeforeY1 - amountY1;
    const marginAfterY2 = marginBeforeY2 - amountY2;
    const marginAfterY3 = marginBeforeY3 - amountY3;

    const warnings: string[] = [];
    let canAccept = true;

    if (marginAfterY1 < 0) {
      warnings.push(`Année 1: Dépassement de la marge de ${Math.abs(marginAfterY1).toFixed(2)}`);
      canAccept = false;
    }
    if (marginAfterY2 < 0) {
      warnings.push(`Année 2: Dépassement de la marge de ${Math.abs(marginAfterY2).toFixed(2)}`);
      canAccept = false;
    }
    if (marginAfterY3 < 0) {
      warnings.push(`Année 3: Dépassement de la marge de ${Math.abs(marginAfterY3).toFixed(2)}`);
      canAccept = false;
    }

    // Warning if using more than 80% of remaining margin
    if (marginAfterY1 < marginBeforeY1 * 0.2 && marginAfterY1 >= 0) {
      warnings.push(`Année 1: Utilisation de plus de 80% de la marge restante`);
    }

    return {
      canAccept,
      marginBeforeY1,
      marginBeforeY2,
      marginBeforeY3,
      marginAfterY1,
      marginAfterY2,
      marginAfterY3,
      warnings,
    };
  }

  /**
   * Get measures by ministry with aggregation
   */
  static async getMeasuresByMinistryAggregated(scenarioId: string): Promise<{
    ministries: {
      ministryId: string;
      ministryName: string;
      measureCount: number;
      totalY1: number;
      totalY2: number;
      totalY3: number;
      byCategory: {
        category: string;
        count: number;
        totalY1: number;
        totalY2: number;
        totalY3: number;
      }[];
    }[];
    grandTotal: { y1: number; y2: number; y3: number };
  }> {
    const measures = await prisma.policyMeasure.findMany({
      where: { scenarioId },
      include: { ministry: true },
    });

    const ministryMap = new Map<
      string,
      {
        ministryName: string;
        measures: typeof measures;
      }
    >();

    for (const measure of measures) {
      if (!ministryMap.has(measure.ministryId)) {
        ministryMap.set(measure.ministryId, {
          ministryName: measure.ministry.name,
          measures: [],
        });
      }
      ministryMap.get(measure.ministryId)!.measures.push(measure);
    }

    const ministries = Array.from(ministryMap.entries()).map(([ministryId, data]) => {
      // Group by category
      const categoryMap = new Map<string, typeof measures>();
      for (const m of data.measures) {
        const cat = m.category || 'OTHER';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, []);
        }
        categoryMap.get(cat)!.push(m);
      }

      return {
        ministryId,
        ministryName: data.ministryName,
        measureCount: data.measures.length,
        totalY1: data.measures.reduce((sum, m) => sum + parseFloat(m.amountY1.toString()), 0),
        totalY2: data.measures.reduce((sum, m) => sum + parseFloat(m.amountY2.toString()), 0),
        totalY3: data.measures.reduce((sum, m) => sum + parseFloat(m.amountY3.toString()), 0),
        byCategory: Array.from(categoryMap.entries()).map(([category, catMeasures]) => ({
          category,
          count: catMeasures.length,
          totalY1: catMeasures.reduce((sum, m) => sum + parseFloat(m.amountY1.toString()), 0),
          totalY2: catMeasures.reduce((sum, m) => sum + parseFloat(m.amountY2.toString()), 0),
          totalY3: catMeasures.reduce((sum, m) => sum + parseFloat(m.amountY3.toString()), 0),
        })),
      };
    });

    return {
      ministries,
      grandTotal: {
        y1: ministries.reduce((sum, m) => sum + m.totalY1, 0),
        y2: ministries.reduce((sum, m) => sum + m.totalY2, 0),
        y3: ministries.reduce((sum, m) => sum + m.totalY3, 0),
      },
    };
  }

  // ============================================================================
  // REQ-GLOB-04: Priority-Based Margin Distribution
  // ============================================================================

  /**
   * Suggest margin allocation based on priorities
   */
  static async suggestMarginAllocation(
    scenarioId: string,
    strategy: 'EQUAL' | 'PRIORITY_WEIGHTED' | 'HISTORICAL_BASED' | 'CUSTOM'
  ): Promise<{
    suggestions: {
      ministryId: string;
      ministryName: string;
      isPriority: boolean;
      suggestedY1: number;
      suggestedY2: number;
      suggestedY3: number;
      rationale: string;
    }[];
    totalAllocatedY1: number;
    totalAllocatedY2: number;
    totalAllocatedY3: number;
    remainingY1: number;
    remainingY2: number;
    remainingY3: number;
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario non trouvé');
    }

    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      orderBy: [{ isPriority: 'desc' }, { name: 'asc' }],
    });

    // Get current measures total to calculate available margin
    const currentMeasures = await prisma.policyMeasure.findMany({
      where: { scenarioId },
    });

    const measuresY1 = currentMeasures.reduce(
      (sum, m) => sum + parseFloat(m.amountY1.toString()),
      0
    );
    const measuresY2 = currentMeasures.reduce(
      (sum, m) => sum + parseFloat(m.amountY2.toString()),
      0
    );
    const measuresY3 = currentMeasures.reduce(
      (sum, m) => sum + parseFloat(m.amountY3.toString()),
      0
    );

    const availableY1 = parseFloat(scenario.fiscalMarginY1.toString()) - measuresY1;
    const availableY2 = parseFloat(scenario.fiscalMarginY2.toString()) - measuresY2;
    const availableY3 = parseFloat(scenario.fiscalMarginY3.toString()) - measuresY3;

    const suggestions: {
      ministryId: string;
      ministryName: string;
      isPriority: boolean;
      suggestedY1: number;
      suggestedY2: number;
      suggestedY3: number;
      rationale: string;
    }[] = [];

    const priorityMinistries = ministries.filter((m) => m.isPriority);
    const nonPriorityMinistries = ministries.filter((m) => !m.isPriority);

    if (strategy === 'EQUAL') {
      // Equal distribution among all ministries
      const perMinistryY1 = availableY1 / ministries.length;
      const perMinistryY2 = availableY2 / ministries.length;
      const perMinistryY3 = availableY3 / ministries.length;

      for (const ministry of ministries) {
        suggestions.push({
          ministryId: ministry.id,
          ministryName: ministry.name,
          isPriority: ministry.isPriority,
          suggestedY1: perMinistryY1,
          suggestedY2: perMinistryY2,
          suggestedY3: perMinistryY3,
          rationale: 'Distribution égale entre tous les ministères',
        });
      }
    } else if (strategy === 'PRIORITY_WEIGHTED') {
      // Priority ministries get 70%, non-priority get 30%
      const priorityShare = 0.7;
      const priorityPoolY1 = availableY1 * priorityShare;
      const priorityPoolY2 = availableY2 * priorityShare;
      const priorityPoolY3 = availableY3 * priorityShare;

      const nonPriorityPoolY1 = availableY1 * (1 - priorityShare);
      const nonPriorityPoolY2 = availableY2 * (1 - priorityShare);
      const nonPriorityPoolY3 = availableY3 * (1 - priorityShare);

      const perPriorityY1 = priorityMinistries.length > 0 ? priorityPoolY1 / priorityMinistries.length : 0;
      const perPriorityY2 = priorityMinistries.length > 0 ? priorityPoolY2 / priorityMinistries.length : 0;
      const perPriorityY3 = priorityMinistries.length > 0 ? priorityPoolY3 / priorityMinistries.length : 0;

      const perNonPriorityY1 = nonPriorityMinistries.length > 0 ? nonPriorityPoolY1 / nonPriorityMinistries.length : 0;
      const perNonPriorityY2 = nonPriorityMinistries.length > 0 ? nonPriorityPoolY2 / nonPriorityMinistries.length : 0;
      const perNonPriorityY3 = nonPriorityMinistries.length > 0 ? nonPriorityPoolY3 / nonPriorityMinistries.length : 0;

      for (const ministry of priorityMinistries) {
        suggestions.push({
          ministryId: ministry.id,
          ministryName: ministry.name,
          isPriority: true,
          suggestedY1: perPriorityY1,
          suggestedY2: perPriorityY2,
          suggestedY3: perPriorityY3,
          rationale: 'Ministère prioritaire (70% de la marge répartie entre ministères prioritaires)',
        });
      }

      for (const ministry of nonPriorityMinistries) {
        suggestions.push({
          ministryId: ministry.id,
          ministryName: ministry.name,
          isPriority: false,
          suggestedY1: perNonPriorityY1,
          suggestedY2: perNonPriorityY2,
          suggestedY3: perNonPriorityY3,
          rationale: 'Ministère non prioritaire (30% de la marge répartie)',
        });
      }
    } else if (strategy === 'HISTORICAL_BASED') {
      // Based on historical budget weights
      const trendConfig = scenario.trendConfigId
        ? await prisma.trendBudgetConfig.findUnique({
            where: { id: scenario.trendConfigId },
          })
        : null;

      if (trendConfig) {
        const historicalBudgets = await prisma.historicalBudget.findMany({
          where: { trendConfigId: trendConfig.id },
        });

        const ministryTotals = new Map<string, number>();
        let grandTotal = 0;

        for (const budget of historicalBudgets) {
          const amount = parseFloat(budget.budgetAmount.toString());
          ministryTotals.set(
            budget.ministryId,
            (ministryTotals.get(budget.ministryId) || 0) + amount
          );
          grandTotal += amount;
        }

        for (const ministry of ministries) {
          const ministryTotal = ministryTotals.get(ministry.id) || 0;
          const weight = grandTotal > 0 ? ministryTotal / grandTotal : 1 / ministries.length;

          suggestions.push({
            ministryId: ministry.id,
            ministryName: ministry.name,
            isPriority: ministry.isPriority,
            suggestedY1: availableY1 * weight,
            suggestedY2: availableY2 * weight,
            suggestedY3: availableY3 * weight,
            rationale: `Basé sur le poids historique (${(weight * 100).toFixed(1)}% du budget total)`,
          });
        }
      } else {
        // Fallback to equal distribution if no historical data
        const perMinistryY1 = availableY1 / ministries.length;
        const perMinistryY2 = availableY2 / ministries.length;
        const perMinistryY3 = availableY3 / ministries.length;

        for (const ministry of ministries) {
          suggestions.push({
            ministryId: ministry.id,
            ministryName: ministry.name,
            isPriority: ministry.isPriority,
            suggestedY1: perMinistryY1,
            suggestedY2: perMinistryY2,
            suggestedY3: perMinistryY3,
            rationale: 'Pas de données historiques - distribution égale par défaut',
          });
        }
      }
    }

    const totalAllocatedY1 = suggestions.reduce((sum, s) => sum + s.suggestedY1, 0);
    const totalAllocatedY2 = suggestions.reduce((sum, s) => sum + s.suggestedY2, 0);
    const totalAllocatedY3 = suggestions.reduce((sum, s) => sum + s.suggestedY3, 0);

    return {
      suggestions,
      totalAllocatedY1,
      totalAllocatedY2,
      totalAllocatedY3,
      remainingY1: availableY1 - totalAllocatedY1,
      remainingY2: availableY2 - totalAllocatedY2,
      remainingY3: availableY3 - totalAllocatedY3,
    };
  }

  /**
   * Apply margin allocation with justification requirement
   */
  static async applyMarginAllocationWithJustification(
    scenarioId: string,
    allocations: {
      ministryId: string;
      allocatedY1: number;
      allocatedY2: number;
      allocatedY3: number;
      justification: string;
    }[],
    createdBy: string
  ): Promise<{
    applied: number;
    warnings: string[];
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario non trouvé');
    }

    const warnings: string[] = [];
    let applied = 0;

    // Validate total doesn't exceed margin
    const totalY1 = allocations.reduce((sum, a) => sum + a.allocatedY1, 0);
    const totalY2 = allocations.reduce((sum, a) => sum + a.allocatedY2, 0);
    const totalY3 = allocations.reduce((sum, a) => sum + a.allocatedY3, 0);

    const marginY1 = parseFloat(scenario.fiscalMarginY1.toString());
    const marginY2 = parseFloat(scenario.fiscalMarginY2.toString());
    const marginY3 = parseFloat(scenario.fiscalMarginY3.toString());

    if (totalY1 > marginY1) {
      warnings.push(`Année 1: Allocation totale (${totalY1.toFixed(2)}) dépasse la marge (${marginY1.toFixed(2)})`);
    }
    if (totalY2 > marginY2) {
      warnings.push(`Année 2: Allocation totale (${totalY2.toFixed(2)}) dépasse la marge (${marginY2.toFixed(2)})`);
    }
    if (totalY3 > marginY3) {
      warnings.push(`Année 3: Allocation totale (${totalY3.toFixed(2)}) dépasse la marge (${marginY3.toFixed(2)})`);
    }

    // Apply allocations
    for (const allocation of allocations) {
      if (!allocation.justification || allocation.justification.trim().length < 10) {
        warnings.push(
          `Ministère ${allocation.ministryId}: Justification requise (minimum 10 caractères)`
        );
        continue;
      }

      await prisma.marginAllocation.upsert({
        where: {
          scenarioId_ministryId: {
            scenarioId,
            ministryId: allocation.ministryId,
          },
        },
        create: {
          scenarioId,
          ministryId: allocation.ministryId,
          allocatedY1: allocation.allocatedY1,
          allocatedY2: allocation.allocatedY2,
          allocatedY3: allocation.allocatedY3,
          notes: allocation.justification,
          allocationMethod: 'MANUAL',
          createdBy,
        },
        update: {
          allocatedY1: allocation.allocatedY1,
          allocatedY2: allocation.allocatedY2,
          allocatedY3: allocation.allocatedY3,
          notes: allocation.justification,
          allocationMethod: 'MANUAL',
        },
      });

      applied++;
    }

    // Recalculate ceilings
    const { CDMTGlobalCalculationService } = await import('./cdmtGlobalCalculation.service');
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(scenarioId);

    return { applied, warnings };
  }
}
