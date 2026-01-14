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

/**
 * Marge de manœuvre par catégorie économique
 * Conforme au Guide Méthodologique CDMT (p.20)
 * Formule: Marge = Dépenses CBMT par catégorie - Tendanciel par catégorie
 */
interface FiscalMarginByCategory {
  // Personnel
  personnelCBMT: { y1: number; y2: number; y3: number };
  personnelTendanciel: { y1: number; y2: number; y3: number };
  personnelMargin: { y1: number; y2: number; y3: number };

  // Biens et Services
  goodsServicesCBMT: { y1: number; y2: number; y3: number };
  goodsServicesTendanciel: { y1: number; y2: number; y3: number };
  goodsServicesMargin: { y1: number; y2: number; y3: number };

  // Transferts
  transfersCBMT: { y1: number; y2: number; y3: number };
  transfersTendanciel: { y1: number; y2: number; y3: number };
  transfersMargin: { y1: number; y2: number; y3: number };

  // Investissements internes
  internalInvestmentCBMT: { y1: number; y2: number; y3: number };
  internalInvestmentTendanciel: { y1: number; y2: number; y3: number };
  internalInvestmentMargin: { y1: number; y2: number; y3: number };

  // Investissements externes
  externalInvestmentCBMT: { y1: number; y2: number; y3: number };
  externalInvestmentTendanciel: { y1: number; y2: number; y3: number };
  externalInvestmentMargin: { y1: number; y2: number; y3: number };

  // Total global
  totalMargin: { y1: number; y2: number; y3: number };
}

// Catégories économiques selon le Guide Méthodologique CDMT
enum EconomicCategory {
  PERSONNEL = 'PERSONNEL',
  GOODS_SERVICES = 'GOODS_SERVICES',
  TRANSFERS = 'TRANSFERS',
  INTERNAL_INVESTMENT = 'INTERNAL_INVESTMENT',
  EXTERNAL_INVESTMENT = 'EXTERNAL_INVESTMENT',
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
   * Calculer la marge de manœuvre par catégorie économique
   *
   * Guide Méthodologique CDMT (p.20):
   * "Marge de manœuvre = Dépenses catégorie X (CBMT) - Tendanciel catégorie X (tous ministères)"
   *
   * Cette méthode calcule la marge pour chaque catégorie économique:
   * - Personnel
   * - Biens et Services
   * - Transferts
   * - Investissements internes
   * - Investissements externes
   */
  static async calculateFiscalMarginByCategory(
    cbmtDocumentId: string,
    trendConfigId: string
  ): Promise<FiscalMarginByCategory> {
    // Récupérer les agrégats CBMT par catégorie
    const cbmtAggregates = await prisma.cBMTAggregate.findMany({
      where: {
        cbmtDocumentId,
        aggregateType: 'EXPENSE',
      },
      include: {
        cbmtDocument: true,
      },
    });

    // Récupérer les projections tendancielles
    const trendProjections = await prisma.trendProjection.findMany({
      where: { trendConfigId },
      include: {
        economicNature: true,
        fundingSource: true,
      },
    });

    // Récupérer les natures économiques pour le mapping
    const economicNatures = await prisma.economicNature.findMany();

    // Mapping des natures vers les catégories du Guide
    const categoryMapping: Record<string, EconomicCategory> = {};
    for (const nature of economicNatures) {
      const code = nature.code.toString();
      if (code.startsWith('1') || nature.name.toLowerCase().includes('personnel')) {
        categoryMapping[nature.id] = EconomicCategory.PERSONNEL;
      } else if (code.startsWith('2') || nature.name.toLowerCase().includes('bien') || nature.name.toLowerCase().includes('service')) {
        categoryMapping[nature.id] = EconomicCategory.GOODS_SERVICES;
      } else if (code.startsWith('3') || nature.name.toLowerCase().includes('transfert')) {
        categoryMapping[nature.id] = EconomicCategory.TRANSFERS;
      } else if (code.startsWith('4') || code.startsWith('5')) {
        categoryMapping[nature.id] = EconomicCategory.INTERNAL_INVESTMENT;
      } else {
        categoryMapping[nature.id] = EconomicCategory.GOODS_SERVICES;
      }
    }

    // Sources de financement externes
    const externalFundingSources = await prisma.fundingSource.findMany({
      where: {
        OR: [
          { code: { contains: 'EXT' } },
          { name: { contains: 'externe' } },
          { name: { contains: 'Externe' } },
          { name: { contains: 'PTF' } },
          { type: { contains: 'EXTERNAL' } },
        ],
      },
    });
    const externalSourceIds = new Set(externalFundingSources.map(f => f.id));

    // Initialiser les résultats CBMT par catégorie
    const cbmtByCategory: Record<EconomicCategory, { y1: number; y2: number; y3: number }> = {
      [EconomicCategory.PERSONNEL]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.GOODS_SERVICES]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.TRANSFERS]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.INTERNAL_INVESTMENT]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.EXTERNAL_INVESTMENT]: { y1: 0, y2: 0, y3: 0 },
    };

    // Agréger les dépenses CBMT par catégorie
    for (const aggregate of cbmtAggregates) {
      const code = aggregate.categoryCode.toString();
      let category: EconomicCategory;

      if (code.startsWith('1') || aggregate.categoryName.toLowerCase().includes('personnel')) {
        category = EconomicCategory.PERSONNEL;
      } else if (code.startsWith('2') || aggregate.categoryName.toLowerCase().includes('bien') || aggregate.categoryName.toLowerCase().includes('service')) {
        category = EconomicCategory.GOODS_SERVICES;
      } else if (code.startsWith('3') || aggregate.categoryName.toLowerCase().includes('transfert')) {
        category = EconomicCategory.TRANSFERS;
      } else if (code.startsWith('4') || aggregate.categoryName.toLowerCase().includes('invest') && aggregate.categoryName.toLowerCase().includes('intern')) {
        category = EconomicCategory.INTERNAL_INVESTMENT;
      } else if (code.startsWith('5') || aggregate.categoryName.toLowerCase().includes('invest') && aggregate.categoryName.toLowerCase().includes('extern')) {
        category = EconomicCategory.EXTERNAL_INVESTMENT;
      } else {
        category = EconomicCategory.GOODS_SERVICES;
      }

      cbmtByCategory[category].y1 += parseFloat(aggregate.amount1.toString());
      cbmtByCategory[category].y2 += parseFloat(aggregate.amount2.toString());
      cbmtByCategory[category].y3 += parseFloat(aggregate.amount3.toString());
    }

    // Initialiser les résultats Tendanciel par catégorie
    const tendancielByCategory: Record<EconomicCategory, { y1: number; y2: number; y3: number }> = {
      [EconomicCategory.PERSONNEL]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.GOODS_SERVICES]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.TRANSFERS]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.INTERNAL_INVESTMENT]: { y1: 0, y2: 0, y3: 0 },
      [EconomicCategory.EXTERNAL_INVESTMENT]: { y1: 0, y2: 0, y3: 0 },
    };

    // Agréger les tendanciels par catégorie
    for (const projection of trendProjections) {
      let category = categoryMapping[projection.economicNatureId || ''] || EconomicCategory.GOODS_SERVICES;

      // Si c'est un investissement avec financement externe
      if (category === EconomicCategory.INTERNAL_INVESTMENT && projection.fundingSourceId && externalSourceIds.has(projection.fundingSourceId)) {
        category = EconomicCategory.EXTERNAL_INVESTMENT;
      }

      tendancielByCategory[category].y1 += parseFloat(projection.projectedAmount1.toString());
      tendancielByCategory[category].y2 += parseFloat(projection.projectedAmount2.toString());
      tendancielByCategory[category].y3 += parseFloat(projection.projectedAmount3.toString());
    }

    // Calculer la marge par catégorie (CBMT - Tendanciel)
    const personnelMargin = {
      y1: cbmtByCategory[EconomicCategory.PERSONNEL].y1 - tendancielByCategory[EconomicCategory.PERSONNEL].y1,
      y2: cbmtByCategory[EconomicCategory.PERSONNEL].y2 - tendancielByCategory[EconomicCategory.PERSONNEL].y2,
      y3: cbmtByCategory[EconomicCategory.PERSONNEL].y3 - tendancielByCategory[EconomicCategory.PERSONNEL].y3,
    };

    const goodsServicesMargin = {
      y1: cbmtByCategory[EconomicCategory.GOODS_SERVICES].y1 - tendancielByCategory[EconomicCategory.GOODS_SERVICES].y1,
      y2: cbmtByCategory[EconomicCategory.GOODS_SERVICES].y2 - tendancielByCategory[EconomicCategory.GOODS_SERVICES].y2,
      y3: cbmtByCategory[EconomicCategory.GOODS_SERVICES].y3 - tendancielByCategory[EconomicCategory.GOODS_SERVICES].y3,
    };

    const transfersMargin = {
      y1: cbmtByCategory[EconomicCategory.TRANSFERS].y1 - tendancielByCategory[EconomicCategory.TRANSFERS].y1,
      y2: cbmtByCategory[EconomicCategory.TRANSFERS].y2 - tendancielByCategory[EconomicCategory.TRANSFERS].y2,
      y3: cbmtByCategory[EconomicCategory.TRANSFERS].y3 - tendancielByCategory[EconomicCategory.TRANSFERS].y3,
    };

    const internalInvestmentMargin = {
      y1: cbmtByCategory[EconomicCategory.INTERNAL_INVESTMENT].y1 - tendancielByCategory[EconomicCategory.INTERNAL_INVESTMENT].y1,
      y2: cbmtByCategory[EconomicCategory.INTERNAL_INVESTMENT].y2 - tendancielByCategory[EconomicCategory.INTERNAL_INVESTMENT].y2,
      y3: cbmtByCategory[EconomicCategory.INTERNAL_INVESTMENT].y3 - tendancielByCategory[EconomicCategory.INTERNAL_INVESTMENT].y3,
    };

    const externalInvestmentMargin = {
      y1: cbmtByCategory[EconomicCategory.EXTERNAL_INVESTMENT].y1 - tendancielByCategory[EconomicCategory.EXTERNAL_INVESTMENT].y1,
      y2: cbmtByCategory[EconomicCategory.EXTERNAL_INVESTMENT].y2 - tendancielByCategory[EconomicCategory.EXTERNAL_INVESTMENT].y2,
      y3: cbmtByCategory[EconomicCategory.EXTERNAL_INVESTMENT].y3 - tendancielByCategory[EconomicCategory.EXTERNAL_INVESTMENT].y3,
    };

    // Marge totale
    const totalMargin = {
      y1: personnelMargin.y1 + goodsServicesMargin.y1 + transfersMargin.y1 + internalInvestmentMargin.y1 + externalInvestmentMargin.y1,
      y2: personnelMargin.y2 + goodsServicesMargin.y2 + transfersMargin.y2 + internalInvestmentMargin.y2 + externalInvestmentMargin.y2,
      y3: personnelMargin.y3 + goodsServicesMargin.y3 + transfersMargin.y3 + internalInvestmentMargin.y3 + externalInvestmentMargin.y3,
    };

    return {
      personnelCBMT: cbmtByCategory[EconomicCategory.PERSONNEL],
      personnelTendanciel: tendancielByCategory[EconomicCategory.PERSONNEL],
      personnelMargin,

      goodsServicesCBMT: cbmtByCategory[EconomicCategory.GOODS_SERVICES],
      goodsServicesTendanciel: tendancielByCategory[EconomicCategory.GOODS_SERVICES],
      goodsServicesMargin,

      transfersCBMT: cbmtByCategory[EconomicCategory.TRANSFERS],
      transfersTendanciel: tendancielByCategory[EconomicCategory.TRANSFERS],
      transfersMargin,

      internalInvestmentCBMT: cbmtByCategory[EconomicCategory.INTERNAL_INVESTMENT],
      internalInvestmentTendanciel: tendancielByCategory[EconomicCategory.INTERNAL_INVESTMENT],
      internalInvestmentMargin,

      externalInvestmentCBMT: cbmtByCategory[EconomicCategory.EXTERNAL_INVESTMENT],
      externalInvestmentTendanciel: tendancielByCategory[EconomicCategory.EXTERNAL_INVESTMENT],
      externalInvestmentMargin,

      totalMargin,
    };
  }

  /**
   * Mettre à jour la marge par catégorie dans un scénario CDMT Global
   */
  static async updateScenarioMarginByCategory(
    scenarioId: string,
    cbmtDocumentId: string,
    trendConfigId: string
  ): Promise<void> {
    const marginByCategory = await this.calculateFiscalMarginByCategory(cbmtDocumentId, trendConfigId);

    await prisma.cDMTGlobalScenario.update({
      where: { id: scenarioId },
      data: {
        marginPersonnelY1: marginByCategory.personnelMargin.y1,
        marginPersonnelY2: marginByCategory.personnelMargin.y2,
        marginPersonnelY3: marginByCategory.personnelMargin.y3,
        marginGoodsServicesY1: marginByCategory.goodsServicesMargin.y1,
        marginGoodsServicesY2: marginByCategory.goodsServicesMargin.y2,
        marginGoodsServicesY3: marginByCategory.goodsServicesMargin.y3,
        marginTransfersY1: marginByCategory.transfersMargin.y1,
        marginTransfersY2: marginByCategory.transfersMargin.y2,
        marginTransfersY3: marginByCategory.transfersMargin.y3,
        marginInternalInvestmentY1: marginByCategory.internalInvestmentMargin.y1,
        marginInternalInvestmentY2: marginByCategory.internalInvestmentMargin.y2,
        marginInternalInvestmentY3: marginByCategory.internalInvestmentMargin.y3,
        marginExternalInvestmentY1: marginByCategory.externalInvestmentMargin.y1,
        marginExternalInvestmentY2: marginByCategory.externalInvestmentMargin.y2,
        marginExternalInvestmentY3: marginByCategory.externalInvestmentMargin.y3,
      },
    });
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

  // ========================================
  // INTEGRATION MODULE FISCAL MARGINS
  // ========================================

  /**
   * Récupérer les marges disponibles depuis le module FiscalMargin
   * Utilise les données importées depuis Excel (feuille "Marge de manoeuvre disponible")
   */
  static async getAvailableMarginsFromModule(
    macroFrameworkId: string
  ): Promise<{
    byCategory: Record<string, { y1: number; y2: number; y3: number }>;
    totals: { y1: number; y2: number; y3: number };
  }> {
    const availableMargins = await prisma.availableFiscalMargin.findMany({
      where: { macroFrameworkId, isActive: true },
    });

    const byCategory: Record<string, { y1: number; y2: number; y3: number }> = {};
    let totalY1 = 0, totalY2 = 0, totalY3 = 0;

    for (const margin of availableMargins) {
      byCategory[margin.categoryCode] = {
        y1: parseFloat(margin.availableMarginY1.toString()),
        y2: parseFloat(margin.availableMarginY2.toString()),
        y3: parseFloat(margin.availableMarginY3.toString()),
      };
      totalY1 += parseFloat(margin.availableMarginY1.toString());
      totalY2 += parseFloat(margin.availableMarginY2.toString());
      totalY3 += parseFloat(margin.availableMarginY3.toString());
    }

    return {
      byCategory,
      totals: { y1: totalY1, y2: totalY2, y3: totalY3 },
    };
  }

  /**
   * Récupérer les taux de réserves depuis le module FiscalMargin
   * Utilise les données importées depuis Excel (feuille "Taux des réserves")
   */
  static async getReserveRatesFromModule(
    macroFrameworkId: string
  ): Promise<Record<string, {
    contingencyY1: number; programmingY1: number;
    contingencyY2: number; programmingY2: number;
    contingencyY3: number; programmingY3: number;
  }>> {
    const reserveRates = await prisma.reserveRate.findMany({
      where: { macroFrameworkId, isActive: true },
    });

    const ratesByCategory: Record<string, any> = {};

    for (const rate of reserveRates) {
      ratesByCategory[rate.categoryCode] = {
        contingencyY1: parseFloat(rate.contingencyRateY1.toString()),
        programmingY1: parseFloat(rate.programmingRateY1.toString()),
        contingencyY2: parseFloat(rate.contingencyRateY2.toString()),
        programmingY2: parseFloat(rate.programmingRateY2.toString()),
        contingencyY3: parseFloat(rate.contingencyRateY3.toString()),
        programmingY3: parseFloat(rate.programmingRateY3.toString()),
      };
    }

    return ratesByCategory;
  }

  /**
   * Récupérer les clés de répartition depuis le module FiscalMargin
   * Utilise les données importées depuis Excel (feuille "Clé répartition")
   */
  static async getDistributionKeysFromModule(
    macroFrameworkId: string
  ): Promise<{
    keys: Record<string, { y1: number; y2: number; y3: number }>;
    totalRate: { y1: number; y2: number; y3: number };
  }> {
    const distributionKeys = await prisma.distributionKey.findMany({
      where: { macroFrameworkId, isActive: true },
      include: { ministry: true },
    });

    const keys: Record<string, { y1: number; y2: number; y3: number }> = {};
    let totalY1 = 0, totalY2 = 0, totalY3 = 0;

    for (const key of distributionKeys) {
      keys[key.ministryId] = {
        y1: parseFloat(key.rateY1.toString()),
        y2: parseFloat(key.rateY2.toString()),
        y3: parseFloat(key.rateY3.toString()),
      };
      totalY1 += parseFloat(key.rateY1.toString());
      totalY2 += parseFloat(key.rateY2.toString());
      totalY3 += parseFloat(key.rateY3.toString());
    }

    return {
      keys,
      totalRate: { y1: totalY1, y2: totalY2, y3: totalY3 },
    };
  }

  /**
   * Récupérer les marges par ministère depuis le module FiscalMargin
   * Utilise les données importées depuis Excel (feuille "Marge par ministère")
   */
  static async getMinistryMarginsFromModule(
    macroFrameworkId: string
  ): Promise<{
    byMinistry: Record<string, {
      byCategory: Record<string, { y1: number; y2: number; y3: number }>;
      totals: { y1: number; y2: number; y3: number };
    }>;
    grandTotal: { y1: number; y2: number; y3: number };
  }> {
    const ministryMargins = await prisma.ministryMargin.findMany({
      where: { macroFrameworkId, isActive: true },
      include: { ministry: true },
    });

    const byMinistry: Record<string, any> = {};
    let grandTotalY1 = 0, grandTotalY2 = 0, grandTotalY3 = 0;

    for (const margin of ministryMargins) {
      if (!byMinistry[margin.ministryId]) {
        byMinistry[margin.ministryId] = {
          ministryName: margin.ministry.name,
          ministryCode: margin.ministry.code,
          byCategory: {},
          totals: { y1: 0, y2: 0, y3: 0 },
        };
      }

      const marginY1 = parseFloat(margin.marginY1.toString());
      const marginY2 = parseFloat(margin.marginY2.toString());
      const marginY3 = parseFloat(margin.marginY3.toString());

      byMinistry[margin.ministryId].byCategory[margin.categoryCode] = {
        y1: marginY1,
        y2: marginY2,
        y3: marginY3,
      };

      byMinistry[margin.ministryId].totals.y1 += marginY1;
      byMinistry[margin.ministryId].totals.y2 += marginY2;
      byMinistry[margin.ministryId].totals.y3 += marginY3;

      grandTotalY1 += marginY1;
      grandTotalY2 += marginY2;
      grandTotalY3 += marginY3;
    }

    return {
      byMinistry,
      grandTotal: { y1: grandTotalY1, y2: grandTotalY2, y3: grandTotalY3 },
    };
  }

  /**
   * Calculer les plafonds ministériels en utilisant les données du module FiscalMargin
   * Formule: Plafond = Tendanciel + Mesures Nouvelles + Marge Allouée (depuis FiscalMargin)
   */
  static async calculateCeilingsWithFiscalMarginModule(
    scenarioId: string
  ): Promise<{
    calculated: number;
    updated: number;
    usedFiscalMarginData: boolean;
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    // Récupérer le macroFrameworkId lié au scénario
    const macroFramework = await prisma.macroFramework.findFirst({
      where: { fiscalYearId: scenario.fiscalYear.toString() },
      orderBy: { createdAt: 'desc' },
    });

    let usedFiscalMarginData = false;
    let ministryMarginsData: Record<string, { y1: number; y2: number; y3: number }> = {};

    if (macroFramework) {
      // Essayer de récupérer les marges depuis le module FiscalMargin
      const fiscalMarginData = await this.getMinistryMarginsFromModule(macroFramework.id);

      if (Object.keys(fiscalMarginData.byMinistry).length > 0) {
        usedFiscalMarginData = true;

        // Convertir en format simple ministryId -> totals
        for (const [ministryId, data] of Object.entries(fiscalMarginData.byMinistry)) {
          ministryMarginsData[ministryId] = data.totals;
        }
      }
    }

    // Récupérer les données de base
    const baselineByMinistry = scenario.trendConfigId
      ? await this.aggregateAllBaselinesByMinistry(scenario.trendConfigId)
      : {};

    const measuresByMinistry = await this.aggregatePolicyMeasuresByMinistry(scenarioId);

    // Récupérer les allocations manuelles (fallback si pas de données FiscalMargin)
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

      // Utiliser les marges du module FiscalMargin si disponibles
      let allocatedY1 = 0, allocatedY2 = 0, allocatedY3 = 0;

      if (usedFiscalMarginData && ministryMarginsData[ministry.id]) {
        allocatedY1 = ministryMarginsData[ministry.id].y1;
        allocatedY2 = ministryMarginsData[ministry.id].y2;
        allocatedY3 = ministryMarginsData[ministry.id].y3;
      } else {
        // Fallback sur les allocations manuelles
        const allocation = allocations.find((a) => a.ministryId === ministry.id);
        allocatedY1 = allocation ? parseFloat(allocation.allocatedY1.toString()) : 0;
        allocatedY2 = allocation ? parseFloat(allocation.allocatedY2.toString()) : 0;
        allocatedY3 = allocation ? parseFloat(allocation.allocatedY3.toString()) : 0;
      }

      // Calculer les plafonds
      const ceilingY1 = baseline.y1 + measures.y1 + allocatedY1;
      const ceilingY2 = baseline.y2 + measures.y2 + allocatedY2;
      const ceilingY3 = baseline.y3 + measures.y3 + allocatedY3;

      // Upsert pour Y1, Y2, Y3
      for (let yearOffset = 1; yearOffset <= 3; yearOffset++) {
        const yearData = yearOffset === 1
          ? { baseline: baseline.y1, measures: measures.y1, allocated: allocatedY1, ceiling: ceilingY1 }
          : yearOffset === 2
          ? { baseline: baseline.y2, measures: measures.y2, allocated: allocatedY2, ceiling: ceilingY2 }
          : { baseline: baseline.y3, measures: measures.y3, allocated: allocatedY3, ceiling: ceilingY3 };

        await prisma.ministerialCeiling.upsert({
          where: {
            scenarioId_ministryId_budgetYear_year: {
              scenarioId,
              ministryId: ministry.id,
              budgetYear: scenario.fiscalYear,
              year: scenario.fiscalYear + yearOffset,
            },
          },
          create: {
            scenarioId,
            ministryId: ministry.id,
            budgetYear: scenario.fiscalYear,
            year: scenario.fiscalYear + yearOffset,
            baseline: yearData.baseline,
            newMeasures: yearData.measures,
            allocatedSpace: yearData.allocated,
            ceiling: yearData.ceiling,
            calculatedAt: new Date(),
          },
          update: {
            baseline: yearData.baseline,
            newMeasures: yearData.measures,
            allocatedSpace: yearData.allocated,
            ceiling: yearData.ceiling,
            calculatedAt: new Date(),
          },
        });

        calculated++;
        updated++;
      }
    }

    // Mettre à jour les totaux du scénario
    await this.calculateScenarioTotals(scenarioId);

    return { calculated, updated, usedFiscalMarginData };
  }

  /**
   * Obtenir un résumé complet des liaisons CDMT Global avec FiscalMargin
   */
  static async getFiscalMarginIntegrationSummary(
    macroFrameworkId: string
  ): Promise<{
    hasData: boolean;
    reserveRates: number;
    availableMargins: number;
    distributionKeys: number;
    ministryMargins: number;
    totals: {
      availableMarginY1: number;
      availableMarginY2: number;
      availableMarginY3: number;
      ministryMarginY1: number;
      ministryMarginY2: number;
      ministryMarginY3: number;
    };
  }> {
    const [reserveRates, availableMargins, distributionKeys, ministryMargins] = await Promise.all([
      prisma.reserveRate.count({ where: { macroFrameworkId, isActive: true } }),
      prisma.availableFiscalMargin.findMany({ where: { macroFrameworkId, isActive: true } }),
      prisma.distributionKey.count({ where: { macroFrameworkId, isActive: true } }),
      prisma.ministryMargin.findMany({ where: { macroFrameworkId, isActive: true } }),
    ]);

    const availableMarginTotals = availableMargins.reduce(
      (acc, m) => ({
        y1: acc.y1 + parseFloat(m.availableMarginY1.toString()),
        y2: acc.y2 + parseFloat(m.availableMarginY2.toString()),
        y3: acc.y3 + parseFloat(m.availableMarginY3.toString()),
      }),
      { y1: 0, y2: 0, y3: 0 }
    );

    const ministryMarginTotals = ministryMargins.reduce(
      (acc, m) => ({
        y1: acc.y1 + parseFloat(m.marginY1.toString()),
        y2: acc.y2 + parseFloat(m.marginY2.toString()),
        y3: acc.y3 + parseFloat(m.marginY3.toString()),
      }),
      { y1: 0, y2: 0, y3: 0 }
    );

    return {
      hasData: reserveRates > 0 || availableMargins.length > 0 || distributionKeys > 0 || ministryMargins.length > 0,
      reserveRates,
      availableMargins: availableMargins.length,
      distributionKeys,
      ministryMargins: ministryMargins.length,
      totals: {
        availableMarginY1: availableMarginTotals.y1,
        availableMarginY2: availableMarginTotals.y2,
        availableMarginY3: availableMarginTotals.y3,
        ministryMarginY1: ministryMarginTotals.y1,
        ministryMarginY2: ministryMarginTotals.y2,
        ministryMarginY3: ministryMarginTotals.y3,
      },
    };
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
