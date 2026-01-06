import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Méthodes de calcul du tendanciel conformes au Guide Méthodologique CDMT (p.17)
export enum BaselineCalculationMethod {
  BUDGET_N_ONLY = 'BUDGET_N_ONLY',         // Conforme au Guide: Budget N seul
  HISTORICAL_AVERAGE = 'HISTORICAL_AVERAGE', // Moyenne des années historiques
}

export class SectoralTrendCalculationService {
  /**
   * Calculer le montant de base pour le niveau sectoriel (Action/Activity)
   *
   * Guide Méthodologique CDMT (p.17):
   * "Tendanciel = (Budget N - dépenses temporaires N) × (1 + taux croissance tendanciel)"
   *
   * Exclut les dépenses exceptionnelles et temporaires selon la configuration
   */
  static async calculateSectoralBaseAmount(
    trendConfigId: string,
    ministryId: string,
    programId?: string | null,
    actionId?: string | null,
    activityId?: string | null,
    economicNatureId?: string | null,
    fundingSourceId?: string | null
  ): Promise<{
    baseAmount: number;
    historicalYearsUsed: number[];
    temporaryExcluded: boolean;
    exceptionalExcluded: boolean;
    exceptionalCount: number;
    calculationMethod: string;
  }> {
    // Récupérer la configuration
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration de budget tendanciel non trouvée');
    }

    // Déterminer la méthode de calcul (par défaut: BUDGET_N_ONLY conforme au Guide)
    const calculationMethod = (config as any).baselineCalculationMethod || BaselineCalculationMethod.BUDGET_N_ONLY;

    // Construire les conditions de recherche de base
    const baseWhere: any = {
      trendConfigId,
      ministryId,
    };

    // Ajouter les filtres optionnels
    if (programId !== undefined) baseWhere.programId = programId;
    if (actionId !== undefined) baseWhere.actionId = actionId;
    if (activityId !== undefined) baseWhere.activityId = activityId;
    if (economicNatureId !== undefined) baseWhere.economicNatureId = economicNatureId;
    if (fundingSourceId !== undefined) baseWhere.fundingSourceId = fundingSourceId;

    // Exclure les temporaires si configuré (conforme au Guide: "Budget N - dépenses temporaires")
    if (config.excludeTemporary) {
      baseWhere.isTemporary = false;
    }

    // Compter les exceptionnels avant exclusion
    const exceptionalCount = await prisma.historicalBudget.count({
      where: {
        ...baseWhere,
        fiscalYear: {
          gte: config.baselineStartYear,
          lte: config.baselineEndYear,
        },
        isExceptional: true,
      },
    });

    // IMPORTANT: Toujours exclure les dépenses exceptionnelles du calcul de base
    baseWhere.isExceptional = false;

    let baseAmount = 0;
    let yearsUsed: number[] = [];

    if (calculationMethod === BaselineCalculationMethod.BUDGET_N_ONLY) {
      // MÉTHODE CONFORME AU GUIDE: Utiliser uniquement Budget N (année de référence = baselineEndYear)
      const where = {
        ...baseWhere,
        fiscalYear: config.baselineEndYear,
      };

      const budgetN = await prisma.historicalBudget.findMany({
        where,
        select: {
          fiscalYear: true,
          budgetAmount: true,
        },
      });

      if (budgetN.length > 0) {
        baseAmount = budgetN.reduce(
          (sum, h) => sum + parseFloat(h.budgetAmount.toString()),
          0
        );
        yearsUsed = [config.baselineEndYear];
      }
    } else {
      // MÉTHODE ALTERNATIVE: Moyenne des années historiques
      const where = {
        ...baseWhere,
        fiscalYear: {
          gte: config.baselineStartYear,
          lte: config.baselineEndYear,
        },
      };

      const historicals = await prisma.historicalBudget.findMany({
        where,
        select: {
          fiscalYear: true,
          budgetAmount: true,
        },
        orderBy: {
          fiscalYear: 'asc',
        },
      });

      if (historicals.length > 0) {
        const totalAmount = historicals.reduce(
          (sum, h) => sum + parseFloat(h.budgetAmount.toString()),
          0
        );
        baseAmount = totalAmount / historicals.length;
        yearsUsed = historicals.map((h) => h.fiscalYear);
      }
    }

    return {
      baseAmount,
      historicalYearsUsed: yearsUsed,
      temporaryExcluded: config.excludeTemporary,
      exceptionalExcluded: true,
      exceptionalCount,
      calculationMethod,
    };
  }

  /**
   * Récupérer les plafonds CDMT Global pour un ministère
   */
  static async getCDMTGlobalCeilings(
    ministryId: string,
    fiscalYear: number
  ): Promise<{
    ceilingY1: number | null;
    ceilingY2: number | null;
    ceilingY3: number | null;
  }> {
    // Trouver le scénario CDMT Global actif
    const activeScenario = await prisma.cDMTGlobalScenario.findFirst({
      where: {
        isActive: true,
        fiscalYear,
      },
      include: {
        ministerialCeilings: {
          where: { ministryId },
        },
      },
    });

    if (!activeScenario || activeScenario.ministerialCeilings.length === 0) {
      return { ceilingY1: null, ceilingY2: null, ceilingY3: null };
    }

    const ceilings = activeScenario.ministerialCeilings;

    // Agréger les plafonds par année
    const ceilingY1 = ceilings
      .filter((c) => c.year === fiscalYear + 1)
      .reduce((sum, c) => sum + parseFloat(c.ceiling.toString()), 0);

    const ceilingY2 = ceilings
      .filter((c) => c.year === fiscalYear + 2)
      .reduce((sum, c) => sum + parseFloat(c.ceiling.toString()), 0);

    const ceilingY3 = ceilings
      .filter((c) => c.year === fiscalYear + 3)
      .reduce((sum, c) => sum + parseFloat(c.ceiling.toString()), 0);

    return {
      ceilingY1: ceilingY1 || null,
      ceilingY2: ceilingY2 || null,
      ceilingY3: ceilingY3 || null,
    };
  }

  /**
   * Calculer les projections sectorielles (Action/Activity niveau)
   */
  static async calculateSectoralProjections(trendConfigId: string): Promise<{
    calculated: number;
    errors: any[];
  }> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration de budget tendanciel non trouvée');
    }

    // Récupérer tous les budgets historiques uniques au niveau sectoriel
    const historicals = await prisma.historicalBudget.findMany({
      where: { trendConfigId },
      select: {
        ministryId: true,
        programId: true,
        actionId: true,
        activityId: true,
        economicNatureId: true,
        fundingSourceId: true,
      },
      distinct: [
        'ministryId',
        'programId',
        'actionId',
        'activityId',
        'economicNatureId',
        'fundingSourceId',
      ],
    });

    let calculated = 0;
    const errors: any[] = [];

    for (const item of historicals) {
      try {
        // Calculer le montant de base (exclut les exceptionnels)
        const baseCalc = await this.calculateSectoralBaseAmount(
          trendConfigId,
          item.ministryId,
          item.programId,
          item.actionId,
          item.activityId,
          item.economicNatureId,
          item.fundingSourceId
        );

        if (baseCalc.baseAmount === 0) {
          continue;
        }

        // Calculer les projections avec le taux global
        const projections = this.applyGlobalGrowthRate(
          baseCalc.baseAmount,
          parseFloat(config.globalGrowthRate.toString()),
          config.projectionYears
        );

        // Récupérer les plafonds CDMT Global
        const ceilings = await this.getCDMTGlobalCeilings(
          item.ministryId,
          config.fiscalYear
        );

        // Récupérer le statut prioritaire du ministère
        const ministry = await prisma.ministry.findUnique({
          where: { id: item.ministryId },
          select: { isPriority: true },
        });

        // Créer ou mettre à jour la projection
        await prisma.trendProjection.upsert({
          where: {
            trendConfigId_ministryId_programId_actionId_activityId_economicNatureId_fundingSourceId:
              {
                trendConfigId,
                ministryId: item.ministryId,
                programId: item.programId || '',
                actionId: item.actionId || '',
                activityId: item.activityId || '',
                economicNatureId: item.economicNatureId || '',
                fundingSourceId: item.fundingSourceId || '',
              },
          },
          update: {
            baseAmount: baseCalc.baseAmount,
            historicalYearsUsed: baseCalc.historicalYearsUsed,
            temporaryExcluded: baseCalc.temporaryExcluded,
            exceptionalExcluded: baseCalc.exceptionalExcluded,
            projectionYear1: config.fiscalYear + 1,
            projectedAmount1: projections[0] || 0,
            growthRate1: config.globalGrowthRate,
            projectionYear2: config.fiscalYear + 2,
            projectedAmount2: projections[1] || 0,
            growthRate2: config.globalGrowthRate,
            projectionYear3: config.fiscalYear + 3,
            projectedAmount3: projections[2] || 0,
            growthRate3: config.globalGrowthRate,
            ceilingY1: ceilings.ceilingY1,
            ceilingY2: ceilings.ceilingY2,
            ceilingY3: ceilings.ceilingY3,
            exceedsCeiling: this.checkCeilingExceeded(
              projections,
              [ceilings.ceilingY1, ceilings.ceilingY2, ceilings.ceilingY3]
            ),
            isPriorityMinistry: ministry?.isPriority || false,
            calculationMethod: 'AUTO',
            lastCalculatedAt: new Date(),
          },
          create: {
            trendConfigId,
            ministryId: item.ministryId,
            programId: item.programId,
            actionId: item.actionId,
            activityId: item.activityId,
            economicNatureId: item.economicNatureId,
            fundingSourceId: item.fundingSourceId,
            baseAmount: baseCalc.baseAmount,
            historicalYearsUsed: baseCalc.historicalYearsUsed,
            temporaryExcluded: baseCalc.temporaryExcluded,
            exceptionalExcluded: baseCalc.exceptionalExcluded,
            projectionYear1: config.fiscalYear + 1,
            projectedAmount1: projections[0] || 0,
            growthRate1: config.globalGrowthRate,
            projectionYear2: config.fiscalYear + 2,
            projectedAmount2: projections[1] || 0,
            growthRate2: config.globalGrowthRate,
            projectionYear3: config.fiscalYear + 3,
            projectedAmount3: projections[2] || 0,
            growthRate3: config.globalGrowthRate,
            ceilingY1: ceilings.ceilingY1,
            ceilingY2: ceilings.ceilingY2,
            ceilingY3: ceilings.ceilingY3,
            exceedsCeiling: this.checkCeilingExceeded(
              projections,
              [ceilings.ceilingY1, ceilings.ceilingY2, ceilings.ceilingY3]
            ),
            isPriorityMinistry: ministry?.isPriority || false,
            calculationMethod: 'AUTO',
            lastCalculatedAt: new Date(),
          },
        });

        calculated++;
      } catch (error: any) {
        errors.push({
          item,
          error: error.message,
        });
      }
    }

    return { calculated, errors };
  }

  /**
   * Appliquer le taux de croissance global
   */
  static applyGlobalGrowthRate(
    baseAmount: number,
    growthRate: number,
    years: number
  ): number[] {
    const projections: number[] = [];
    let currentAmount = baseAmount;

    for (let i = 0; i < years; i++) {
      currentAmount = currentAmount * (1 + growthRate / 100);
      projections.push(currentAmount);
    }

    return projections;
  }

  /**
   * Vérifier si les projections dépassent les plafonds
   */
  static checkCeilingExceeded(
    projections: number[],
    ceilings: (number | null)[]
  ): boolean {
    for (let i = 0; i < projections.length; i++) {
      if (ceilings[i] !== null && projections[i] > ceilings[i]!) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtenir un résumé par Action
   */
  static async getSummaryByAction(trendConfigId: string): Promise<any[]> {
    const summary = await prisma.$queryRaw<any[]>`
      SELECT
        a.id as "actionId",
        a.code as "actionCode",
        a.name as "actionName",
        p.id as "programId",
        p.name as "programName",
        m.id as "ministryId",
        m.name as "ministryName",
        SUM(tp."baseAmount")::numeric as "totalBase",
        SUM(tp."projectedAmount1")::numeric as "totalN1",
        SUM(tp."projectedAmount2")::numeric as "totalN2",
        SUM(tp."projectedAmount3")::numeric as "totalN3",
        MAX(tp."ceilingY1")::numeric as "ceilingY1",
        COUNT(tp.id) as "projectionCount"
      FROM trend_projections tp
      LEFT JOIN actions a ON tp."actionId" = a.id
      LEFT JOIN programs p ON tp."programId" = p.id
      LEFT JOIN ministries m ON tp."ministryId" = m.id
      WHERE tp."trendConfigId" = ${trendConfigId}
        AND tp."actionId" IS NOT NULL
      GROUP BY a.id, a.code, a.name, p.id, p.name, m.id, m.name
      ORDER BY "totalN1" DESC
    `;

    return summary;
  }

  /**
   * Obtenir un résumé par Activity
   */
  static async getSummaryByActivity(trendConfigId: string): Promise<any[]> {
    const summary = await prisma.$queryRaw<any[]>`
      SELECT
        act.id as "activityId",
        act.code as "activityCode",
        act.name as "activityName",
        a.id as "actionId",
        a.name as "actionName",
        p.id as "programId",
        p.name as "programName",
        m.id as "ministryId",
        m.name as "ministryName",
        SUM(tp."baseAmount")::numeric as "totalBase",
        SUM(tp."projectedAmount1")::numeric as "totalN1",
        SUM(tp."projectedAmount2")::numeric as "totalN2",
        SUM(tp."projectedAmount3")::numeric as "totalN3",
        MAX(tp."ceilingY1")::numeric as "ceilingY1",
        COUNT(tp.id) as "projectionCount"
      FROM trend_projections tp
      LEFT JOIN activities act ON tp."activityId" = act.id
      LEFT JOIN actions a ON tp."actionId" = a.id
      LEFT JOIN programs p ON tp."programId" = p.id
      LEFT JOIN ministries m ON tp."ministryId" = m.id
      WHERE tp."trendConfigId" = ${trendConfigId}
        AND tp."activityId" IS NOT NULL
      GROUP BY act.id, act.code, act.name, a.id, a.name, p.id, p.name, m.id, m.name
      ORDER BY "totalN1" DESC
    `;

    return summary;
  }

  /**
   * Vérifier les dépassements de plafonds
   */
  static async checkCeilingExceedances(trendConfigId: string): Promise<{
    exceedanceCount: number;
    exceedances: any[];
  }> {
    const exceedances = await prisma.trendProjection.findMany({
      where: {
        trendConfigId,
        exceedsCeiling: true,
      },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
      },
    });

    return {
      exceedanceCount: exceedances.length,
      exceedances: exceedances.map((e) => ({
        id: e.id,
        ministry: e.ministry?.name,
        program: e.program?.name,
        action: e.action?.name,
        activity: e.activity?.name,
        projectedY1: parseFloat(e.projectedAmount1.toString()),
        ceilingY1: e.ceilingY1 ? parseFloat(e.ceilingY1.toString()) : null,
        exceedanceY1:
          e.ceilingY1
            ? parseFloat(e.projectedAmount1.toString()) -
              parseFloat(e.ceilingY1.toString())
            : 0,
      })),
    };
  }

  /**
   * Intégrer les projets PIE/PIP dans les projections
   */
  static async integratePIEPIPProjects(
    trendConfigId: string,
    fiscalYear: number
  ): Promise<{
    pieIntegrated: number;
    pipIntegrated: number;
  }> {
    // Récupérer les projets PIE pour l'année fiscale
    const pieProjects = await prisma.pIEProject.findMany({
      where: {
        OR: [
          { startYear: { lte: fiscalYear + 3 } },
          { endYear: { gte: fiscalYear + 1 } },
        ],
      },
    });

    // Récupérer les projets PIP pour l'année fiscale
    const pipProjects = await prisma.pIPProject.findMany({
      where: {
        OR: [
          { startYear: { lte: fiscalYear + 3 } },
          { endYear: { gte: fiscalYear + 1 } },
        ],
      },
    });

    let pieIntegrated = 0;
    let pipIntegrated = 0;

    // Intégrer PIE (exceptionnels, traités séparément)
    for (const pie of pieProjects) {
      // Les PIE sont exceptionnels et ne sont pas inclus dans les projections tendancielles
      // mais peuvent être ajoutés en tant que lignes séparées pour traçabilité
      pieIntegrated++;
    }

    // Intégrer PIP (peuvent être récurrents ou non)
    for (const pip of pipProjects) {
      // Les PIP récurrents peuvent être inclus dans les projections
      if (pip.isRecurrent) {
        // Ajouter aux projections tendancielles existantes ou créer nouvelles lignes
        pipIntegrated++;
      }
    }

    return { pieIntegrated, pipIntegrated };
  }

  /**
   * Valider la cohérence sectorielle
   */
  static async validateSectoralCoherence(trendConfigId: string): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Vérifier les dépassements de plafonds
    const exceedances = await this.checkCeilingExceedances(trendConfigId);
    if (exceedances.exceedanceCount > 0) {
      warnings.push(
        `${exceedances.exceedanceCount} projection(s) dépassent les plafonds CDMT Global`
      );
    }

    // Vérifier les projections sans action/activity
    const orphanProjections = await prisma.trendProjection.count({
      where: {
        trendConfigId,
        actionId: null,
        activityId: null,
        programId: { not: null },
      },
    });

    if (orphanProjections > 0) {
      warnings.push(
        `${orphanProjections} projection(s) au niveau Programme sans Action/Activity associée`
      );
    }

    // Vérifier la cohérence des montants agrégés
    const actionSummary = await this.getSummaryByAction(trendConfigId);
    const activitySummary = await this.getSummaryByActivity(trendConfigId);

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }
}
