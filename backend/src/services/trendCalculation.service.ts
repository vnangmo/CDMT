import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class TrendCalculationService {
  /**
   * Calculer le montant de base (moyenne des historiques)
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
  }> {
    // Récupérer la configuration
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration de budget tendanciel non trouvée');
    }

    // Construire les conditions de recherche
    const where: any = {
      trendConfigId,
      ministryId,
      fiscalYear: {
        gte: config.baselineStartYear,
        lte: config.baselineEndYear,
      },
    };

    // Ajouter les filtres optionnels (gestion des valeurs null/undefined)
    if (programId !== undefined) where.programId = programId;
    if (economicNatureId !== undefined) where.economicNatureId = economicNatureId;
    if (fundingSourceId !== undefined) where.fundingSourceId = fundingSourceId;

    // Exclure les temporaires si configuré
    if (config.excludeTemporary) {
      where.isTemporary = false;
    }

    // Récupérer les budgets historiques
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

    if (historicals.length === 0) {
      return {
        baseAmount: 0,
        historicalYearsUsed: [],
        temporaryExcluded: config.excludeTemporary,
      };
    }

    // Calculer la moyenne
    const totalAmount = historicals.reduce(
      (sum, h) => sum + parseFloat(h.budgetAmount.toString()),
      0
    );
    const baseAmount = totalAmount / historicals.length;
    const yearsUsed = historicals.map((h) => h.fiscalYear);

    return {
      baseAmount,
      historicalYearsUsed: yearsUsed,
      temporaryExcluded: config.excludeTemporary,
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

    // Récupérer tous les budgets historiques uniques (par dimension)
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

    // Pour chaque dimension unique, calculer la projection
    for (const item of historicals) {
      try {
        // Calculer le montant de base
        const baseCalc = await this.calculateBaseAmount(
          trendConfigId,
          item.ministryId,
          item.programId,
          item.economicNatureId,
          item.fundingSourceId
        );

        if (baseCalc.baseAmount === 0) {
          continue; // Pas de données historiques, skip
        }

        // Calculer les projections avec le taux global
        const projections = this.applyGlobalGrowthRate(
          baseCalc.baseAmount,
          parseFloat(config.globalGrowthRate.toString()),
          config.projectionYears
        );

        // Récupérer le statut prioritaire du ministère
        const ministry = await prisma.ministry.findUnique({
          where: { id: item.ministryId },
          select: { isPriority: true },
        });

        // Créer ou mettre à jour la projection
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
            growthRate1: config.globalGrowthRate,
            projectionYear2: config.fiscalYear + 2,
            projectedAmount2: projections[1] || 0,
            growthRate2: config.globalGrowthRate,
            projectionYear3: config.fiscalYear + 3,
            projectedAmount3: projections[2] || 0,
            growthRate3: config.globalGrowthRate,
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
            growthRate1: config.globalGrowthRate,
            projectionYear2: config.fiscalYear + 2,
            projectedAmount2: projections[1] || 0,
            growthRate2: config.globalGrowthRate,
            projectionYear3: config.fiscalYear + 3,
            projectedAmount3: projections[2] || 0,
            growthRate3: config.globalGrowthRate,
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

    // Calculer le montant de base
    const baseCalc = await this.calculateBaseAmount(
      projection.trendConfigId,
      projection.ministryId,
      projection.programId,
      projection.economicNatureId,
      projection.fundingSourceId
    );

    // Calculer les projections
    const projections = this.applyGlobalGrowthRate(
      baseCalc.baseAmount,
      parseFloat(projection.trendConfig.globalGrowthRate.toString()),
      projection.trendConfig.projectionYears
    );

    // Récupérer le statut prioritaire
    const ministry = await prisma.ministry.findUnique({
      where: { id: projection.ministryId },
      select: { isPriority: true },
    });

    // Mettre à jour la projection
    return await prisma.trendProjection.update({
      where: { id: projectionId },
      data: {
        baseAmount: baseCalc.baseAmount,
        historicalYearsUsed: baseCalc.historicalYearsUsed,
        temporaryExcluded: baseCalc.temporaryExcluded,
        projectedAmount1: projections[0] || 0,
        projectedAmount2: projections[1] || 0,
        projectedAmount3: projections[2] || 0,
        growthRate1: projection.trendConfig.globalGrowthRate,
        growthRate2: projection.trendConfig.globalGrowthRate,
        growthRate3: projection.trendConfig.globalGrowthRate,
        isPriorityMinistry: ministry?.isPriority || false,
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
