import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Méthodes de calcul du tendanciel conformes au Guide Méthodologique CDMT (p.17)
export enum BaselineCalculationMethod {
  BUDGET_N_ONLY = 'BUDGET_N_ONLY',         // Conforme au Guide: Budget N seul
  HISTORICAL_AVERAGE = 'HISTORICAL_AVERAGE', // Moyenne des années historiques
}

export class TrendCalculationService {
  /**
   * Calculer le montant de base selon la méthode configurée
   *
   * Guide Méthodologique CDMT (p.17):
   * "Tendanciel = (Budget N - dépenses temporaires N) × (1 + taux croissance tendanciel)"
   *
   * Deux méthodes supportées:
   * - BUDGET_N_ONLY: Utilise uniquement le Budget de l'année N (conforme au Guide)
   * - HISTORICAL_AVERAGE: Utilise la moyenne des années historiques (approche alternative)
   */
  static async calculateBaseAmount(
    trendConfigId: string,
    ministryId: string,
    programId?: string | null,
    economicNatureId?: string | null,
    fundingSourceId?: string | null
  ): Promise<{
    baseAmount: number;
    historicalYearsUsed: number[];
    temporaryExcluded: boolean;
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

    // Construire les conditions de recherche
    const where: any = {
      trendConfigId,
      ministryId,
    };

    // Ajouter les filtres optionnels (gestion des valeurs null/undefined)
    if (programId !== undefined) where.programId = programId;
    if (economicNatureId !== undefined) where.economicNatureId = economicNatureId;
    if (fundingSourceId !== undefined) where.fundingSourceId = fundingSourceId;

    // Exclure les temporaires si configuré (conforme au Guide: "Budget N - dépenses temporaires")
    if (config.excludeTemporary) {
      where.isTemporary = false;
    }

    let baseAmount = 0;
    let yearsUsed: number[] = [];

    if (calculationMethod === BaselineCalculationMethod.BUDGET_N_ONLY) {
      // MÉTHODE CONFORME AU GUIDE: Utiliser uniquement Budget N (année de référence = baselineEndYear)
      where.fiscalYear = config.baselineEndYear;

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
      where.fiscalYear = {
        gte: config.baselineStartYear,
        lte: config.baselineEndYear,
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
      calculationMethod,
    };
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
   * Calculer toutes les projections pour une configuration
   * Utilise les taux spécifiques par projection (importés depuis Excel) si disponibles,
   * sinon utilise le taux global de la configuration
   */
  static async calculateProjections(trendConfigId: string): Promise<{
    calculated: number;
    errors: any[];
  }> {
    // Récupérer la configuration
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration de budget tendanciel non trouvée');
    }

    // Récupérer les projections existantes (avec taux spécifiques importés)
    const existingProjections = await prisma.trendProjection.findMany({
      where: { trendConfigId },
    });

    // Si des projections existent déjà avec des taux spécifiques (import Excel),
    // recalculer en utilisant CES taux spécifiques
    if (existingProjections.length > 0) {
      let calculated = 0;
      const errors: any[] = [];

      for (const projection of existingProjections) {
        try {
          const baseAmount = parseFloat(projection.baseAmount.toString());

          // Utiliser les taux spécifiques de la projection (non le taux global)
          const rate1 = parseFloat(projection.growthRate1?.toString() || '0');
          const rate2 = parseFloat(projection.growthRate2?.toString() || '0');
          const rate3 = parseFloat(projection.growthRate3?.toString() || '0');

          // Formule conforme au Guide CDMT: Projection = Base × (1 + taux)
          // Les taux sont NON composés (chaque année utilise la base comme référence)
          const projectedAmount1 = baseAmount * (1 + rate1 / 100);
          const projectedAmount2 = baseAmount * (1 + rate2 / 100);
          const projectedAmount3 = baseAmount * (1 + rate3 / 100);

          await prisma.trendProjection.update({
            where: { id: projection.id },
            data: {
              projectedAmount1,
              projectedAmount2,
              projectedAmount3,
              calculationMethod: 'RECALCULATED',
              lastCalculatedAt: new Date(),
            },
          });

          calculated++;
        } catch (error: any) {
          errors.push({
            projectionId: projection.id,
            error: error.message,
          });
        }
      }

      return { calculated, errors };
    }

    // Si pas de projections existantes, créer à partir des historiques avec taux global
    const historicals = await prisma.historicalBudget.findMany({
      where: { trendConfigId },
      select: {
        ministryId: true,
        programId: true,
        economicNatureId: true,
        fundingSourceId: true,
      },
      distinct: ['ministryId', 'programId', 'economicNatureId', 'fundingSourceId'],
    });

    let calculated = 0;
    const errors: any[] = [];

    for (const item of historicals) {
      try {
        const baseCalc = await this.calculateBaseAmount(
          trendConfigId,
          item.ministryId,
          item.programId,
          item.economicNatureId,
          item.fundingSourceId
        );

        if (baseCalc.baseAmount === 0) {
          continue;
        }

        // Utiliser le taux global pour les nouvelles projections
        const globalRate = parseFloat(config.globalGrowthRate.toString());
        const projections = this.applyGlobalGrowthRate(
          baseCalc.baseAmount,
          globalRate,
          config.projectionYears
        );

        const ministry = await prisma.ministry.findUnique({
          where: { id: item.ministryId },
          select: { isPriority: true },
        });

        await prisma.trendProjection.upsert({
          where: {
            trendConfigId_ministryId_programId_actionId_activityId_economicNatureId_fundingSourceId: {
              trendConfigId,
              ministryId: item.ministryId,
              programId: item.programId || '',
              actionId: '',
              activityId: '',
              economicNatureId: item.economicNatureId || '',
              fundingSourceId: item.fundingSourceId || '',
            },
          },
          update: {
            baseAmount: baseCalc.baseAmount,
            historicalYearsUsed: baseCalc.historicalYearsUsed,
            temporaryExcluded: baseCalc.temporaryExcluded,
            projectionYear1: config.fiscalYear + 1,
            projectedAmount1: projections[0] || 0,
            growthRate1: globalRate,
            projectionYear2: config.fiscalYear + 2,
            projectedAmount2: projections[1] || 0,
            growthRate2: globalRate,
            projectionYear3: config.fiscalYear + 3,
            projectedAmount3: projections[2] || 0,
            growthRate3: globalRate,
            isPriorityMinistry: ministry?.isPriority || false,
            calculationMethod: 'AUTO',
            lastCalculatedAt: new Date(),
          },
          create: {
            trendConfigId,
            ministryId: item.ministryId,
            programId: item.programId,
            economicNatureId: item.economicNatureId,
            fundingSourceId: item.fundingSourceId,
            baseAmount: baseCalc.baseAmount,
            historicalYearsUsed: baseCalc.historicalYearsUsed,
            temporaryExcluded: baseCalc.temporaryExcluded,
            projectionYear1: config.fiscalYear + 1,
            projectedAmount1: projections[0] || 0,
            growthRate1: globalRate,
            projectionYear2: config.fiscalYear + 2,
            projectedAmount2: projections[1] || 0,
            growthRate2: globalRate,
            projectionYear3: config.fiscalYear + 3,
            projectedAmount3: projections[2] || 0,
            growthRate3: globalRate,
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
   * Recalculer une projection spécifique
   * Utilise les taux spécifiques de la projection (conservés depuis l'import Excel)
   */
  static async recalculateProjection(projectionId: string): Promise<any> {
    const projection = await prisma.trendProjection.findUnique({
      where: { id: projectionId },
      include: {
        trendConfig: true,
      },
    });

    if (!projection) {
      throw new NotFoundError('Projection non trouvée');
    }

    const baseAmount = parseFloat(projection.baseAmount.toString());

    // Utiliser les taux spécifiques de la projection (pas le taux global)
    const rate1 = parseFloat(projection.growthRate1?.toString() || '0');
    const rate2 = parseFloat(projection.growthRate2?.toString() || '0');
    const rate3 = parseFloat(projection.growthRate3?.toString() || '0');

    // Formule conforme au Guide CDMT: Projection = Base × (1 + taux)
    const projectedAmount1 = baseAmount * (1 + rate1 / 100);
    const projectedAmount2 = baseAmount * (1 + rate2 / 100);
    const projectedAmount3 = baseAmount * (1 + rate3 / 100);

    // Récupérer le statut prioritaire
    const ministry = await prisma.ministry.findUnique({
      where: { id: projection.ministryId },
      select: { isPriority: true },
    });

    // Mettre à jour la projection
    return await prisma.trendProjection.update({
      where: { id: projectionId },
      data: {
        projectedAmount1,
        projectedAmount2,
        projectedAmount3,
        isPriorityMinistry: ministry?.isPriority || false,
        calculationMethod: 'RECALCULATED',
        lastCalculatedAt: new Date(),
      },
    });
  }

  /**
   * Obtenir un résumé par ministère
   */
  static async getSummaryByMinistry(trendConfigId: string): Promise<any[]> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    const summary = await prisma.$queryRaw<any[]>`
      SELECT
        m.id as "ministryId",
        m.name as "ministryName",
        m."isPriority",
        SUM(tp."baseAmount")::numeric as "totalBase",
        SUM(tp."projectedAmount1")::numeric as "totalN1",
        SUM(tp."projectedAmount2")::numeric as "totalN2",
        SUM(tp."projectedAmount3")::numeric as "totalN3",
        COUNT(tp.id) as "projectionCount"
      FROM trend_projections tp
      JOIN ministries m ON tp."ministryId" = m.id
      WHERE tp."trendConfigId" = ${trendConfigId}
      GROUP BY m.id, m.name, m."isPriority"
      ORDER BY "totalN1" DESC
    `;

    return summary;
  }

  /**
   * Obtenir un résumé par priorité
   */
  static async getSummaryByPriority(trendConfigId: string): Promise<any[]> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    const summary = await prisma.$queryRaw<any[]>`
      SELECT
        m."isPriority",
        COUNT(DISTINCT m.id) as "ministryCount",
        SUM(tp."baseAmount")::numeric as "totalBase",
        SUM(tp."projectedAmount1")::numeric as "totalN1",
        SUM(tp."projectedAmount2")::numeric as "totalN2",
        SUM(tp."projectedAmount3")::numeric as "totalN3",
        COUNT(tp.id) as "projectionCount"
      FROM trend_projections tp
      JOIN ministries m ON tp."ministryId" = m.id
      WHERE tp."trendConfigId" = ${trendConfigId}
      GROUP BY m."isPriority"
      ORDER BY m."isPriority" DESC
    `;

    return summary;
  }

  /**
   * Valider la cohérence des projections
   */
  static async validateCoherence(trendConfigId: string): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
      include: {
        historicalBudgets: {
          select: {
            ministryId: true,
            programId: true,
          },
          distinct: ['ministryId', 'programId'],
        },
        trendProjections: {
          select: {
            ministryId: true,
            programId: true,
          },
          distinct: ['ministryId', 'programId'],
        },
      },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    // Vérifier que toutes les dimensions historiques ont une projection
    const historicalKeys = new Set(
      config.historicalBudgets.map(
        (h) => `${h.ministryId}-${h.programId || 'null'}`
      )
    );
    const projectionKeys = new Set(
      config.trendProjections.map(
        (p) => `${p.ministryId}-${p.programId || 'null'}`
      )
    );

    historicalKeys.forEach((key) => {
      if (!projectionKeys.has(key)) {
        warnings.push(
          `Dimension ${key} a des données historiques mais pas de projection`
        );
      }
    });

    // Vérifier les projections avec montant = 0
    const zeroProjections = await prisma.trendProjection.count({
      where: {
        trendConfigId,
        baseAmount: 0,
      },
    });

    if (zeroProjections > 0) {
      warnings.push(
        `${zeroProjections} projection(s) ont un montant de base égal à zéro`
      );
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }
}
