import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

interface FiscalMarginResult {
  marginY1: number;
  marginY2: number;
  marginY3: number;
  details: {
    revenuesY1: number;
    revenuesY2: number;
    revenuesY3: number;
    expensesY1: number;
    expensesY2: number;
    expensesY3: number;
  };
}

interface BaselineByMinistry {
  [ministryId: string]: {
    y1: number;
    y2: number;
    y3: number;
  };
}

interface MarginValidationResult {
  isValid: boolean;
  warnings: string[];
  remainingMarginY1: number;
  remainingMarginY2: number;
  remainingMarginY3: number;
}

export class CDMTGlobalCalculationService {
  /**
   * Calculer la marge fiscale depuis le cadre macroéconomique
   */
  static async calculateFiscalMargin(macroFrameworkId: string): Promise<FiscalMarginResult> {
    const framework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });

    if (!framework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Calculer les totaux de recettes par année
    const revenuesY1 = framework.revenueProjections.reduce(
      (sum, proj) => sum + parseFloat((proj as any).projectedRevenue1?.toString() || (proj as any).amount1?.toString() || '0'),
      0
    );
    const revenuesY2 = framework.revenueProjections.reduce(
      (sum, proj) => sum + parseFloat((proj as any).projectedRevenue2?.toString() || (proj as any).amount2?.toString() || '0'),
      0
    );
    const revenuesY3 = framework.revenueProjections.reduce(
      (sum, proj) => sum + parseFloat((proj as any).projectedRevenue3?.toString() || (proj as any).amount3?.toString() || '0'),
      0
    );

    // Calculer les totaux de dépenses par année
    const expensesY1 = framework.expenseProjections.reduce(
      (sum, proj) => sum + parseFloat((proj as any).projectedExpense1?.toString() || (proj as any).amount1?.toString() || '0'),
      0
    );
    const expensesY2 = framework.expenseProjections.reduce(
      (sum, proj) => sum + parseFloat((proj as any).projectedExpense2?.toString() || (proj as any).amount2?.toString() || '0'),
      0
    );
    const expensesY3 = framework.expenseProjections.reduce(
      (sum, proj) => sum + parseFloat((proj as any).projectedExpense3?.toString() || (proj as any).amount3?.toString() || '0'),
      0
    );

    // Calculer la marge fiscale (revenus - dépenses)
    const marginY1 = revenuesY1 - expensesY1;
    const marginY2 = revenuesY2 - expensesY2;
    const marginY3 = revenuesY3 - expensesY3;

    return {
      marginY1,
      marginY2,
      marginY3,
      details: {
        revenuesY1,
        revenuesY2,
        revenuesY3,
        expensesY1,
        expensesY2,
        expensesY3,
      },
    };
  }

  /**
   * Agréger les budgets tendanciels par ministère pour une année donnée
   */
  static async aggregateBaselineByMinistry(
    trendConfigId: string,
    year: number
  ): Promise<BaselineByMinistry> {
    const trendProjections = await prisma.trendProjection.findMany({
      where: { trendConfigId },
    });

    const baselineByMinistry: BaselineByMinistry = {};

    for (const projection of trendProjections) {
      if (!baselineByMinistry[projection.ministryId]) {
        baselineByMinistry[projection.ministryId] = { y1: 0, y2: 0, y3: 0 };
      }

      // Déterminer quelle année de projection utiliser
      let amount = 0;
      if (projection.projectionYear1 === year) {
        amount = parseFloat(projection.projectedAmount1.toString());
      } else if (projection.projectionYear2 === year) {
        amount = parseFloat(projection.projectedAmount2.toString());
      } else if (projection.projectionYear3 === year) {
        amount = parseFloat(projection.projectedAmount3.toString());
      }

      // Ajouter au bon bucket d'année
      const config = await prisma.trendBudgetConfig.findUnique({
        where: { id: trendConfigId },
      });

      if (!config) {
        throw new NotFoundError('Configuration tendancielle non trouvée');
      }

      if (projection.projectionYear1 === year) {
        baselineByMinistry[projection.ministryId].y1 += amount;
      } else if (projection.projectionYear2 === year) {
        baselineByMinistry[projection.ministryId].y2 += amount;
      } else if (projection.projectionYear3 === year) {
        baselineByMinistry[projection.ministryId].y3 += amount;
      }
    }

    return baselineByMinistry;
  }

  /**
   * Agréger toutes les baselines par ministère pour Y1, Y2, Y3
   */
  static async aggregateAllBaselinesByMinistry(
    trendConfigId: string
  ): Promise<BaselineByMinistry> {
    const trendProjections = await prisma.trendProjection.findMany({
      where: { trendConfigId },
    });

    const baselineByMinistry: BaselineByMinistry = {};

    for (const projection of trendProjections) {
      if (!baselineByMinistry[projection.ministryId]) {
        baselineByMinistry[projection.ministryId] = { y1: 0, y2: 0, y3: 0 };
      }

      baselineByMinistry[projection.ministryId].y1 += parseFloat(
        projection.projectedAmount1.toString()
      );
      baselineByMinistry[projection.ministryId].y2 += parseFloat(
        projection.projectedAmount2.toString()
      );
      baselineByMinistry[projection.ministryId].y3 += parseFloat(
        projection.projectedAmount3.toString()
      );
    }

    return baselineByMinistry;
  }

  /**
   * Agréger les mesures nouvelles par ministère
   */
  static async aggregatePolicyMeasuresByMinistry(
    scenarioId: string
  ): Promise<BaselineByMinistry> {
    const measures = await prisma.policyMeasure.findMany({
      where: { scenarioId },
    });

    const measuresByMinistry: BaselineByMinistry = {};

    for (const measure of measures) {
      if (!measuresByMinistry[measure.ministryId]) {
        measuresByMinistry[measure.ministryId] = { y1: 0, y2: 0, y3: 0 };
      }

      measuresByMinistry[measure.ministryId].y1 += parseFloat(measure.amountY1.toString());
      measuresByMinistry[measure.ministryId].y2 += parseFloat(measure.amountY2.toString());
      measuresByMinistry[measure.ministryId].y3 += parseFloat(measure.amountY3.toString());
    }

    return measuresByMinistry;
  }

  /**
   * Calculer les plafonds ministériels pour un scénario
   */
  static async calculateMinisterialCeilings(scenarioId: string): Promise<{
    calculated: number;
    updated: number;
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    // Récupérer toutes les données nécessaires
    const baselineByMinistry = scenario.trendConfigId
      ? await this.aggregateAllBaselinesByMinistry(scenario.trendConfigId)
      : {};

    const measuresByMinistry = await this.aggregatePolicyMeasuresByMinistry(scenarioId);

    const allocations = await prisma.marginAllocation.findMany({
      where: { scenarioId },
    });

    // Récupérer tous les ministères
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
    });

    let calculated = 0;
    let updated = 0;

    // Calculer les plafonds pour chaque ministère
    for (const ministry of ministries) {
      const baseline = baselineByMinistry[ministry.id] || { y1: 0, y2: 0, y3: 0 };
      const measures = measuresByMinistry[ministry.id] || { y1: 0, y2: 0, y3: 0 };
      const allocation = allocations.find((a) => a.ministryId === ministry.id);

      const allocatedY1 = allocation ? parseFloat(allocation.allocatedY1.toString()) : 0;
      const allocatedY2 = allocation ? parseFloat(allocation.allocatedY2.toString()) : 0;
      const allocatedY3 = allocation ? parseFloat(allocation.allocatedY3.toString()) : 0;

      // Calculer les plafonds
      const ceilingY1 = baseline.y1 + measures.y1 + allocatedY1;
      const ceilingY2 = baseline.y2 + measures.y2 + allocatedY2;
      const ceilingY3 = baseline.y3 + measures.y3 + allocatedY3;

      // Upsert pour Y1
      await prisma.ministerialCeiling.upsert({
        where: {
          scenarioId_ministryId_budgetYear_year: {
            scenarioId,
            ministryId: ministry.id,
            budgetYear: scenario.fiscalYear,
            year: scenario.fiscalYear + 1,
          },
        },
        create: {
          scenarioId,
          ministryId: ministry.id,
          budgetYear: scenario.fiscalYear,
          year: scenario.fiscalYear + 1,
          baseline: baseline.y1,
          newMeasures: measures.y1,
          allocatedSpace: allocatedY1,
          ceiling: ceilingY1,
          calculatedAt: new Date(),
        },
        update: {
          baseline: baseline.y1,
          newMeasures: measures.y1,
          allocatedSpace: allocatedY1,
          ceiling: ceilingY1,
          calculatedAt: new Date(),
        },
      });

      // Upsert pour Y2
      await prisma.ministerialCeiling.upsert({
        where: {
          scenarioId_ministryId_budgetYear_year: {
            scenarioId,
            ministryId: ministry.id,
            budgetYear: scenario.fiscalYear,
            year: scenario.fiscalYear + 2,
          },
        },
        create: {
          scenarioId,
          ministryId: ministry.id,
          budgetYear: scenario.fiscalYear,
          year: scenario.fiscalYear + 2,
          baseline: baseline.y2,
          newMeasures: measures.y2,
          allocatedSpace: allocatedY2,
          ceiling: ceilingY2,
          calculatedAt: new Date(),
        },
        update: {
          baseline: baseline.y2,
          newMeasures: measures.y2,
          allocatedSpace: allocatedY2,
          ceiling: ceilingY2,
          calculatedAt: new Date(),
        },
      });

      // Upsert pour Y3
      await prisma.ministerialCeiling.upsert({
        where: {
          scenarioId_ministryId_budgetYear_year: {
            scenarioId,
            ministryId: ministry.id,
            budgetYear: scenario.fiscalYear,
            year: scenario.fiscalYear + 3,
          },
        },
        create: {
          scenarioId,
          ministryId: ministry.id,
          budgetYear: scenario.fiscalYear,
          year: scenario.fiscalYear + 3,
          baseline: baseline.y3,
          newMeasures: measures.y3,
          allocatedSpace: allocatedY3,
          ceiling: ceilingY3,
          calculatedAt: new Date(),
        },
        update: {
          baseline: baseline.y3,
          newMeasures: measures.y3,
          allocatedSpace: allocatedY3,
          ceiling: ceilingY3,
          calculatedAt: new Date(),
        },
      });

      calculated += 3; // 3 records per ministry
      updated += 3;
    }

    // Mettre à jour les totaux du scénario
    await this.calculateScenarioTotals(scenarioId);

    return { calculated, updated };
  }

  /**
   * Calculer les totaux d'un scénario
   */
  static async calculateScenarioTotals(scenarioId: string): Promise<void> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    // Récupérer tous les plafonds ministériels
    const ceilings = await prisma.ministerialCeiling.findMany({
      where: { scenarioId },
    });

    // Filtrer par année et calculer les totaux
    const y1Ceilings = ceilings.filter((c) => c.year === scenario.fiscalYear + 1);
    const y2Ceilings = ceilings.filter((c) => c.year === scenario.fiscalYear + 2);
    const y3Ceilings = ceilings.filter((c) => c.year === scenario.fiscalYear + 3);

    const totalBaselineY1 = y1Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.baseline.toString()),
      0
    );
    const totalBaselineY2 = y2Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.baseline.toString()),
      0
    );
    const totalBaselineY3 = y3Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.baseline.toString()),
      0
    );

    const totalMeasuresY1 = y1Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.newMeasures.toString()),
      0
    );
    const totalMeasuresY2 = y2Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.newMeasures.toString()),
      0
    );
    const totalMeasuresY3 = y3Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.newMeasures.toString()),
      0
    );

    const totalAllocatedY1 = y1Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.allocatedSpace.toString()),
      0
    );
    const totalAllocatedY2 = y2Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.allocatedSpace.toString()),
      0
    );
    const totalAllocatedY3 = y3Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.allocatedSpace.toString()),
      0
    );

    const totalCeilingY1 = y1Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.ceiling.toString()),
      0
    );
    const totalCeilingY2 = y2Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.ceiling.toString()),
      0
    );
    const totalCeilingY3 = y3Ceilings.reduce(
      (sum, c) => sum + parseFloat(c.ceiling.toString()),
      0
    );

    // Mettre à jour le scénario
    await prisma.cDMTGlobalScenario.update({
      where: { id: scenarioId },
      data: {
        totalBaselineY1,
        totalBaselineY2,
        totalBaselineY3,
        totalMeasuresY1,
        totalMeasuresY2,
        totalMeasuresY3,
        totalAllocatedY1,
        totalAllocatedY2,
        totalAllocatedY3,
        totalCeilingY1,
        totalCeilingY2,
        totalCeilingY3,
      },
    });
  }

  /**
   * Valider l'allocation de la marge fiscale
   */
  static async validateMarginAllocation(
    scenarioId: string
  ): Promise<MarginValidationResult> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    const allocations = await prisma.marginAllocation.findMany({
      where: { scenarioId },
    });

    // Calculer le total alloué par année
    const totalAllocatedY1 = allocations.reduce(
      (sum, a) => sum + parseFloat(a.allocatedY1.toString()),
      0
    );
    const totalAllocatedY2 = allocations.reduce(
      (sum, a) => sum + parseFloat(a.allocatedY2.toString()),
      0
    );
    const totalAllocatedY3 = allocations.reduce(
      (sum, a) => sum + parseFloat(a.allocatedY3.toString()),
      0
    );

    // Vérifier les dépassements
    const fiscalMarginY1 = parseFloat(scenario.fiscalMarginY1.toString());
    const fiscalMarginY2 = parseFloat(scenario.fiscalMarginY2.toString());
    const fiscalMarginY3 = parseFloat(scenario.fiscalMarginY3.toString());

    const isValidY1 = totalAllocatedY1 <= fiscalMarginY1;
    const isValidY2 = totalAllocatedY2 <= fiscalMarginY2;
    const isValidY3 = totalAllocatedY3 <= fiscalMarginY3;

    const warnings: string[] = [];

    if (!isValidY1) {
      const excess = totalAllocatedY1 - fiscalMarginY1;
      warnings.push(
        `Année ${scenario.fiscalYear + 1}: Dépassement de ${excess.toFixed(2)} (alloué: ${totalAllocatedY1.toFixed(2)}, disponible: ${fiscalMarginY1.toFixed(2)})`
      );
    }

    if (!isValidY2) {
      const excess = totalAllocatedY2 - fiscalMarginY2;
      warnings.push(
        `Année ${scenario.fiscalYear + 2}: Dépassement de ${excess.toFixed(2)} (alloué: ${totalAllocatedY2.toFixed(2)}, disponible: ${fiscalMarginY2.toFixed(2)})`
      );
    }

    if (!isValidY3) {
      const excess = totalAllocatedY3 - fiscalMarginY3;
      warnings.push(
        `Année ${scenario.fiscalYear + 3}: Dépassement de ${excess.toFixed(2)} (alloué: ${totalAllocatedY3.toFixed(2)}, disponible: ${fiscalMarginY3.toFixed(2)})`
      );
    }

    return {
      isValid: isValidY1 && isValidY2 && isValidY3,
      warnings,
      remainingMarginY1: fiscalMarginY1 - totalAllocatedY1,
      remainingMarginY2: fiscalMarginY2 - totalAllocatedY2,
      remainingMarginY3: fiscalMarginY3 - totalAllocatedY3,
    };
  }
}
