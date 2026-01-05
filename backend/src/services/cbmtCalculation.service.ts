import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface GapAnalysisResult {
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

interface CeilingSummary {
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

interface BudgetSummary {
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

export class CBMTCalculationService {
  /**
   * Recalculer les écarts pour tous les agrégats d'un document CBMT
   */
  static async recalculateGaps(cbmtDocumentId: string) {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    // Recalculer les écarts pour chaque agrégat
    for (const aggregate of document.aggregates) {
      const gap1 = new Decimal(aggregate.amount1).minus(aggregate.ceiling1 || 0);
      const gap2 = new Decimal(aggregate.amount2).minus(aggregate.ceiling2 || 0);
      const gap3 = new Decimal(aggregate.amount3).minus(aggregate.ceiling3 || 0);

      // Déterminer si un dépassement est détecté
      const isOverrun1 = gap1.greaterThan(0);
      const isOverrun2 = gap2.greaterThan(0);
      const isOverrun3 = gap3.greaterThan(0);
      const isAlertTriggered = isOverrun1 || isOverrun2 || isOverrun3;

      let alertMessage = null;
      if (isAlertTriggered) {
        const overrunYears = [];
        if (isOverrun1) overrunYears.push(aggregate.year1);
        if (isOverrun2) overrunYears.push(aggregate.year2);
        if (isOverrun3) overrunYears.push(aggregate.year3);
        alertMessage = `Dépassement détecté pour les années: ${overrunYears.join(', ')}`;
      }

      await prisma.cBMTAggregate.update({
        where: { id: aggregate.id },
        data: {
          gap1,
          gap2,
          gap3,
          isAlertTriggered,
          alertMessage,
        },
      });
    }

    return { message: 'Écarts recalculés avec succès' };
  }

  /**
   * Analyse des écarts budgétaires par année
   */
  static async analyzeGaps(cbmtDocumentId: string): Promise<GapAnalysisResult[]> {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const revenueAggregates = document.aggregates.filter((a) => a.aggregateType === 'REVENUE');
    const expenseAggregates = document.aggregates.filter((a) => a.aggregateType === 'EXPENSE');

    // Analyser pour chaque année (year1, year2, year3)
    const results: GapAnalysisResult[] = [];

    // Année 1
    const totalRevenue1 = revenueAggregates.reduce(
      (sum, a) => sum + Number(a.amount1 || 0),
      0
    );
    const totalRevenueCeiling1 = revenueAggregates.reduce(
      (sum, a) => sum + Number(a.ceiling1 || 0),
      0
    );
    const totalExpense1 = expenseAggregates.reduce(
      (sum, a) => sum + Number(a.amount1 || 0),
      0
    );
    const totalExpenseCeiling1 = expenseAggregates.reduce(
      (sum, a) => sum + Number(a.ceiling1 || 0),
      0
    );

    results.push({
      year: document.aggregates[0].year1,
      totalRevenue: totalRevenue1,
      totalRevenueProjected: totalRevenue1,
      totalRevenueCeiling: totalRevenueCeiling1,
      revenueGap: totalRevenue1 - totalRevenueCeiling1,
      revenueGapPercentage:
        totalRevenueCeiling1 > 0
          ? ((totalRevenue1 - totalRevenueCeiling1) / totalRevenueCeiling1) * 100
          : 0,
      totalExpense: totalExpense1,
      totalExpenseProjected: totalExpense1,
      totalExpenseCeiling: totalExpenseCeiling1,
      expenseGap: totalExpense1 - totalExpenseCeiling1,
      expenseGapPercentage:
        totalExpenseCeiling1 > 0
          ? ((totalExpense1 - totalExpenseCeiling1) / totalExpenseCeiling1) * 100
          : 0,
      fiscalBalance: totalRevenue1 - totalExpense1,
      hasOverrun: totalExpense1 > totalExpenseCeiling1,
    });

    // Année 2
    const totalRevenue2 = revenueAggregates.reduce(
      (sum, a) => sum + Number(a.amount2 || 0),
      0
    );
    const totalRevenueCeiling2 = revenueAggregates.reduce(
      (sum, a) => sum + Number(a.ceiling2 || 0),
      0
    );
    const totalExpense2 = expenseAggregates.reduce(
      (sum, a) => sum + Number(a.amount2 || 0),
      0
    );
    const totalExpenseCeiling2 = expenseAggregates.reduce(
      (sum, a) => sum + Number(a.ceiling2 || 0),
      0
    );

    results.push({
      year: document.aggregates[0].year2,
      totalRevenue: totalRevenue2,
      totalRevenueProjected: totalRevenue2,
      totalRevenueCeiling: totalRevenueCeiling2,
      revenueGap: totalRevenue2 - totalRevenueCeiling2,
      revenueGapPercentage:
        totalRevenueCeiling2 > 0
          ? ((totalRevenue2 - totalRevenueCeiling2) / totalRevenueCeiling2) * 100
          : 0,
      totalExpense: totalExpense2,
      totalExpenseProjected: totalExpense2,
      totalExpenseCeiling: totalExpenseCeiling2,
      expenseGap: totalExpense2 - totalExpenseCeiling2,
      expenseGapPercentage:
        totalExpenseCeiling2 > 0
          ? ((totalExpense2 - totalExpenseCeiling2) / totalExpenseCeiling2) * 100
          : 0,
      fiscalBalance: totalRevenue2 - totalExpense2,
      hasOverrun: totalExpense2 > totalExpenseCeiling2,
    });

    // Année 3
    const totalRevenue3 = revenueAggregates.reduce(
      (sum, a) => sum + Number(a.amount3 || 0),
      0
    );
    const totalRevenueCeiling3 = revenueAggregates.reduce(
      (sum, a) => sum + Number(a.ceiling3 || 0),
      0
    );
    const totalExpense3 = expenseAggregates.reduce(
      (sum, a) => sum + Number(a.amount3 || 0),
      0
    );
    const totalExpenseCeiling3 = expenseAggregates.reduce(
      (sum, a) => sum + Number(a.ceiling3 || 0),
      0
    );

    results.push({
      year: document.aggregates[0].year3,
      totalRevenue: totalRevenue3,
      totalRevenueProjected: totalRevenue3,
      totalRevenueCeiling: totalRevenueCeiling3,
      revenueGap: totalRevenue3 - totalRevenueCeiling3,
      revenueGapPercentage:
        totalRevenueCeiling3 > 0
          ? ((totalRevenue3 - totalRevenueCeiling3) / totalRevenueCeiling3) * 100
          : 0,
      totalExpense: totalExpense3,
      totalExpenseProjected: totalExpense3,
      totalExpenseCeiling: totalExpenseCeiling3,
      expenseGap: totalExpense3 - totalExpenseCeiling3,
      expenseGapPercentage:
        totalExpenseCeiling3 > 0
          ? ((totalExpense3 - totalExpenseCeiling3) / totalExpenseCeiling3) * 100
          : 0,
      fiscalBalance: totalRevenue3 - totalExpense3,
      hasOverrun: totalExpense3 > totalExpenseCeiling3,
    });

    return results;
  }

  /**
   * Résumé budgétaire par année
   */
  static async getBudgetSummary(cbmtDocumentId: string): Promise<BudgetSummary[]> {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
        reserves: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const summaries: BudgetSummary[] = [];

    // Pour chaque année
    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      const year = document.aggregates[0]?.[`year${yearIndex}` as keyof typeof document.aggregates[0]];

      const revenueAggregates = document.aggregates.filter((a) => a.aggregateType === 'REVENUE');
      const expenseAggregates = document.aggregates.filter((a) => a.aggregateType === 'EXPENSE');

      // Résumé des recettes
      const revenueSummaries: CeilingSummary[] = revenueAggregates.map((a) => {
        const amount = Number(a[`amount${yearIndex}` as keyof typeof a] || 0);
        const ceiling = Number(a[`ceiling${yearIndex}` as keyof typeof a] || 0);
        const gap = amount - ceiling;
        const gapPercentage = ceiling > 0 ? (gap / ceiling) * 100 : 0;
        const isOverrun = gap > 0;
        const riskLevel = this.getRiskLevel(gapPercentage);

        return {
          aggregateType: a.aggregateType,
          categoryCode: a.categoryCode,
          categoryName: a.categoryName,
          year: year as number,
          amount,
          ceiling,
          gap,
          gapPercentage,
          isOverrun,
          riskLevel,
        };
      });

      const totalRevenue = revenueSummaries.reduce((sum, s) => sum + s.amount, 0);
      const totalRevenueCeiling = revenueSummaries.reduce((sum, s) => sum + s.ceiling, 0);
      const revenueGap = totalRevenue - totalRevenueCeiling;
      const revenueGapPercentage =
        totalRevenueCeiling > 0 ? (revenueGap / totalRevenueCeiling) * 100 : 0;

      // Résumé des dépenses
      const expenseSummaries: CeilingSummary[] = expenseAggregates.map((a) => {
        const amount = Number(a[`amount${yearIndex}` as keyof typeof a] || 0);
        const ceiling = Number(a[`ceiling${yearIndex}` as keyof typeof a] || 0);
        const gap = amount - ceiling;
        const gapPercentage = ceiling > 0 ? (gap / ceiling) * 100 : 0;
        const isOverrun = gap > 0;
        const riskLevel = this.getRiskLevel(gapPercentage);

        return {
          aggregateType: a.aggregateType,
          categoryCode: a.categoryCode,
          categoryName: a.categoryName,
          year: year as number,
          amount,
          ceiling,
          gap,
          gapPercentage,
          isOverrun,
          riskLevel,
        };
      });

      const totalExpense = expenseSummaries.reduce((sum, s) => sum + s.amount, 0);
      const totalExpenseCeiling = expenseSummaries.reduce((sum, s) => sum + s.ceiling, 0);
      const expenseGap = totalExpense - totalExpenseCeiling;
      const expenseGapPercentage =
        totalExpenseCeiling > 0 ? (expenseGap / totalExpenseCeiling) * 100 : 0;

      // Résumé des réserves
      const reserves = document.reserves;
      const totalReserves = reserves.reduce(
        (sum, r) => sum + Number(r[`amount${yearIndex}` as keyof typeof r] || 0),
        0
      );
      const allocatedReserves = reserves.reduce(
        (sum, r) => sum + Number(r[`allocated${yearIndex}` as keyof typeof r] || 0),
        0
      );
      const availableReserves = reserves.reduce(
        (sum, r) => sum + Number(r[`available${yearIndex}` as keyof typeof r] || 0),
        0
      );
      const utilizationRate =
        totalReserves > 0 ? (allocatedReserves / totalReserves) * 100 : 0;

      summaries.push({
        year: year as number,
        revenues: {
          total: totalRevenue,
          ceiling: totalRevenueCeiling,
          gap: revenueGap,
          gapPercentage: revenueGapPercentage,
          byCategory: revenueSummaries,
        },
        expenses: {
          total: totalExpense,
          ceiling: totalExpenseCeiling,
          gap: expenseGap,
          gapPercentage: expenseGapPercentage,
          byCategory: expenseSummaries,
        },
        balance: {
          actual: totalRevenue - totalExpense,
          planned: totalRevenueCeiling - totalExpenseCeiling,
          gap: (totalRevenue - totalExpense) - (totalRevenueCeiling - totalExpenseCeiling),
        },
        reserves: {
          total: totalReserves,
          allocated: allocatedReserves,
          available: availableReserves,
          utilizationRate,
        },
      });
    }

    return summaries;
  }

  /**
   * Calculer les plafonds de dépenses basés sur les ressources disponibles
   */
  static async calculateSpendingCeilings(cbmtDocumentId: string) {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
        macroFramework: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const revenueAggregates = document.aggregates.filter((a) => a.aggregateType === 'REVENUE');
    const expenseAggregates = document.aggregates.filter((a) => a.aggregateType === 'EXPENSE');

    // Calculer les plafonds pour chaque année
    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      // Total des recettes pour l'année
      const totalRevenue = revenueAggregates.reduce(
        (sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0),
        0
      );

      // Répartir le plafond total de dépenses proportionnellement
      const totalExpenseProjection = expenseAggregates.reduce(
        (sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0),
        0
      );

      for (const aggregate of expenseAggregates) {
        const amount = Number(aggregate[`amount${yearIndex}` as keyof typeof aggregate] || 0);
        const proportion = totalExpenseProjection > 0 ? amount / totalExpenseProjection : 0;
        const ceiling = totalRevenue * proportion * 0.95; // 95% des recettes pour laisser une marge

        await prisma.cBMTAggregate.update({
          where: { id: aggregate.id },
          data: {
            [`ceiling${yearIndex}`]: new Decimal(ceiling),
          },
        });
      }
    }

    // Recalculer les écarts après mise à jour des plafonds
    await this.recalculateGaps(cbmtDocumentId);

    return { message: 'Plafonds de dépenses calculés avec succès' };
  }

  /**
   * Déterminer le niveau de risque basé sur le pourcentage d'écart
   */
  private static getRiskLevel(gapPercentage: number): string {
    const absGap = Math.abs(gapPercentage);

    if (absGap < 2) {
      return 'LOW';
    } else if (absGap < 5) {
      return 'MEDIUM';
    } else if (absGap < 10) {
      return 'HIGH';
    } else {
      return 'CRITICAL';
    }
  }

  /**
   * Détecter les dépassements et générer des alertes
   */
  static async detectOverruns(cbmtDocumentId: string) {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const alerts: any[] = [];

    for (const aggregate of document.aggregates) {
      for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
        const amount = Number(aggregate[`amount${yearIndex}` as keyof typeof aggregate] || 0);
        const ceiling = Number(aggregate[`ceiling${yearIndex}` as keyof typeof aggregate] || 0);
        const gap = amount - ceiling;

        if (gap > 0) {
          const gapPercentage = ceiling > 0 ? (gap / ceiling) * 100 : 0;
          const year = aggregate[`year${yearIndex}` as keyof typeof aggregate];
          const riskLevel = this.getRiskLevel(gapPercentage);

          alerts.push({
            aggregateId: aggregate.id,
            aggregateType: aggregate.aggregateType,
            categoryCode: aggregate.categoryCode,
            categoryName: aggregate.categoryName,
            year,
            amount,
            ceiling,
            gap,
            gapPercentage,
            riskLevel,
            message: `Dépassement de ${gapPercentage.toFixed(2)}% du plafond pour ${aggregate.categoryName} en ${year}`,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Allouer une partie de la réserve
   */
  static async allocateReserve(
    reserveId: string,
    year: number,
    amount: number
  ) {
    const reserve = await prisma.cBMTReserve.findUnique({
      where: { id: reserveId },
    });

    if (!reserve) {
      throw new NotFoundError('Réserve non trouvée');
    }

    // Déterminer l'index de l'année
    let yearIndex = 0;
    if (year === reserve.year1) yearIndex = 1;
    else if (year === reserve.year2) yearIndex = 2;
    else if (year === reserve.year3) yearIndex = 3;
    else {
      throw new BadRequestError('Année invalide pour cette réserve');
    }

    const currentAllocated = Number(reserve[`allocated${yearIndex}` as keyof typeof reserve] || 0);
    const currentAvailable = Number(reserve[`available${yearIndex}` as keyof typeof reserve] || 0);

    if (amount > currentAvailable) {
      throw new BadRequestError('Montant demandé supérieur au montant disponible');
    }

    await prisma.cBMTReserve.update({
      where: { id: reserveId },
      data: {
        [`allocated${yearIndex}`]: new Decimal(currentAllocated + amount),
        [`available${yearIndex}`]: new Decimal(currentAvailable - amount),
      },
    });

    return { message: 'Réserve allouée avec succès' };
  }
}

export default CBMTCalculationService;
