import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { SectoralMeasureCostingService } from './sectoralMeasureCosting.service';
import { SectoralMeasureValidationService } from './sectoralMeasureValidation.service';

const prisma = new PrismaClient();

interface IntegrationResult {
  success: boolean;
  ministryId: string;
  fiscalYear: number;
  measuresIntegrated: number;
  ceilingsUpdated: number;
  errors: string[];
  warnings: string[];
}

export class SectoralMeasureIntegrationService {
  /**
   * Intégrer les mesures sectorielles validées dans les plafonds ministériels
   * Formule: MinisterialCeiling.newMeasures = Σ(sectoralMeasures[VALIDATED].totalCostY)
   */
  static async integrateMinistryMeasures(
    ministryId: string,
    fiscalYear: number,
    integratedBy: string
  ): Promise<IntegrationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: ministryId },
      select: { name: true },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Valider les mesures avant intégration
    const validation = await SectoralMeasureValidationService.validateMinisteryCeiling(
      ministryId,
      fiscalYear
    );

    if (!validation.isValid) {
      throw new BadRequestError(
        `Impossible d'intégrer: ${validation.totalExceedances} dépassement(s) de plafond détecté(s)`
      );
    }

    // Récupérer les mesures validées (status = VALIDATED)
    const validatedMeasures = await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: 'VALIDATED',
      },
    });

    if (validatedMeasures.length === 0) {
      warnings.push('Aucune mesure validée à intégrer');
      return {
        success: true,
        ministryId,
        fiscalYear,
        measuresIntegrated: 0,
        ceilingsUpdated: 0,
        errors,
        warnings,
      };
    }

    // Calculer les totaux agrégés par année
    const aggregated = validatedMeasures.reduce(
      (acc, m) => {
        acc.totalY1 += parseFloat(m.totalCostY1.toString());
        acc.totalY2 += parseFloat(m.totalCostY2.toString());
        acc.totalY3 += parseFloat(m.totalCostY3.toString());
        return acc;
      },
      { totalY1: 0, totalY2: 0, totalY3: 0 }
    );

    // Intégrer dans les plafonds ministériels pour les 3 années
    const years = [
      { year: fiscalYear + 1, amount: aggregated.totalY1 },
      { year: fiscalYear + 2, amount: aggregated.totalY2 },
      { year: fiscalYear + 3, amount: aggregated.totalY3 },
    ];

    let ceilingsUpdated = 0;

    for (const { year, amount } of years) {
      try {
        // Récupérer le plafond existant
        const existingCeiling = await prisma.ministerialCeiling.findFirst({
          where: {
            ministryId,
            year,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!existingCeiling) {
          warnings.push(
            `Plafond ministériel non trouvé pour ${ministry.name} en ${year}`
          );
          continue;
        }

        // Mettre à jour le champ newMeasures et recalculer le plafond
        // Formule: ceiling = baseline + newMeasures + allocatedSpace
        const updatedCeiling = await prisma.ministerialCeiling.update({
          where: { id: existingCeiling.id },
          data: {
            newMeasures: amount,
            ceiling:
              parseFloat(existingCeiling.baseline.toString()) +
              amount +
              parseFloat(existingCeiling.allocatedSpace.toString()),
            calculatedAt: new Date(),
          },
        });

        ceilingsUpdated++;
      } catch (error) {
        errors.push(`Erreur lors de la mise à jour du plafond pour ${year}: ${error}`);
      }
    }

    // Marquer les mesures comme INTEGRATED
    await prisma.sectoralMeasure.updateMany({
      where: {
        ministryId,
        fiscalYear,
        status: 'VALIDATED',
      },
      data: {
        status: 'INTEGRATED',
        integratedAt: new Date(),
      },
    });

    return {
      success: errors.length === 0,
      ministryId,
      fiscalYear,
      measuresIntegrated: validatedMeasures.length,
      ceilingsUpdated,
      errors,
      warnings,
    };
  }

  /**
   * Réintégrer les mesures après modification des plafonds
   */
  static async reintegrateMinistryMeasures(
    ministryId: string,
    fiscalYear: number,
    integratedBy: string
  ): Promise<IntegrationResult> {
    // Remettre les mesures INTEGRATED à VALIDATED
    await prisma.sectoralMeasure.updateMany({
      where: {
        ministryId,
        fiscalYear,
        status: 'INTEGRATED',
      },
      data: {
        status: 'VALIDATED',
        integratedAt: null,
      },
    });

    // Réintégrer
    return await this.integrateMinistryMeasures(ministryId, fiscalYear, integratedBy);
  }

  /**
   * Annuler l'intégration des mesures
   */
  static async rollbackIntegration(
    ministryId: string,
    fiscalYear: number
  ): Promise<{
    success: boolean;
    measuresRolledBack: number;
    ceilingsReset: number;
  }> {
    // Calculer les totaux des mesures intégrées
    const integratedMeasures = await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: 'INTEGRATED',
      },
    });

    // Remettre à zéro les newMeasures dans les plafonds
    const years = [fiscalYear + 1, fiscalYear + 2, fiscalYear + 3];
    let ceilingsReset = 0;

    for (const year of years) {
      const existingCeiling = await prisma.ministerialCeiling.findFirst({
        where: { ministryId, year },
        orderBy: { createdAt: 'desc' },
      });

      if (existingCeiling) {
        await prisma.ministerialCeiling.update({
          where: { id: existingCeiling.id },
          data: {
            newMeasures: 0,
            ceiling:
              parseFloat(existingCeiling.baseline.toString()) +
              parseFloat(existingCeiling.allocatedSpace.toString()),
            calculatedAt: new Date(),
          },
        });
        ceilingsReset++;
      }
    }

    // Remettre les mesures à VALIDATED
    await prisma.sectoralMeasure.updateMany({
      where: {
        ministryId,
        fiscalYear,
        status: 'INTEGRATED',
      },
      data: {
        status: 'VALIDATED',
        integratedAt: null,
      },
    });

    return {
      success: true,
      measuresRolledBack: integratedMeasures.length,
      ceilingsReset,
    };
  }

  /**
   * Obtenir le statut d'intégration pour un ministère
   */
  static async getIntegrationStatus(ministryId: string, fiscalYear: number) {
    const [draft, proposed, validated, integrated, rejected] = await Promise.all([
      prisma.sectoralMeasure.count({
        where: { ministryId, fiscalYear, status: 'DRAFT' },
      }),
      prisma.sectoralMeasure.count({
        where: { ministryId, fiscalYear, status: 'PROPOSED' },
      }),
      prisma.sectoralMeasure.count({
        where: { ministryId, fiscalYear, status: 'VALIDATED' },
      }),
      prisma.sectoralMeasure.count({
        where: { ministryId, fiscalYear, status: 'INTEGRATED' },
      }),
      prisma.sectoralMeasure.count({
        where: { ministryId, fiscalYear, status: 'REJECTED' },
      }),
    ]);

    const total = draft + proposed + validated + integrated + rejected;

    // Calculer les montants par statut
    const [validatedAmount, integratedAmount] = await Promise.all([
      prisma.sectoralMeasure.aggregate({
        where: { ministryId, fiscalYear, status: 'VALIDATED' },
        _sum: {
          totalCostY1: true,
          totalCostY2: true,
          totalCostY3: true,
        },
      }),
      prisma.sectoralMeasure.aggregate({
        where: { ministryId, fiscalYear, status: 'INTEGRATED' },
        _sum: {
          totalCostY1: true,
          totalCostY2: true,
          totalCostY3: true,
        },
      }),
    ]);

    const isFullyIntegrated = validated === 0 && integrated > 0;
    const isPendingIntegration = validated > 0;

    return {
      ministryId,
      fiscalYear,
      total,
      byStatus: {
        draft,
        proposed,
        validated,
        integrated,
        rejected,
      },
      amounts: {
        validatedY1: validatedAmount._sum.totalCostY1 || 0,
        validatedY2: validatedAmount._sum.totalCostY2 || 0,
        validatedY3: validatedAmount._sum.totalCostY3 || 0,
        integratedY1: integratedAmount._sum.totalCostY1 || 0,
        integratedY2: integratedAmount._sum.totalCostY2 || 0,
        integratedY3: integratedAmount._sum.totalCostY3 || 0,
      },
      status: {
        isFullyIntegrated,
        isPendingIntegration,
        canIntegrate: validated > 0,
        canRollback: integrated > 0,
      },
    };
  }

  /**
   * Intégrer les mesures de tous les ministères pour une année fiscale
   */
  static async integrateAllMinistries(
    fiscalYear: number,
    integratedBy: string
  ): Promise<{
    success: boolean;
    results: IntegrationResult[];
    summary: {
      totalMinistries: number;
      successfulIntegrations: number;
      failedIntegrations: number;
      totalMeasuresIntegrated: number;
    };
  }> {
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const results: IntegrationResult[] = [];

    for (const ministry of ministries) {
      try {
        const result = await this.integrateMinistryMeasures(
          ministry.id,
          fiscalYear,
          integratedBy
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          ministryId: ministry.id,
          fiscalYear,
          measuresIntegrated: 0,
          ceilingsUpdated: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
        });
      }
    }

    const summary = {
      totalMinistries: ministries.length,
      successfulIntegrations: results.filter((r) => r.success).length,
      failedIntegrations: results.filter((r) => !r.success).length,
      totalMeasuresIntegrated: results.reduce((sum, r) => sum + r.measuresIntegrated, 0),
    };

    return {
      success: summary.failedIntegrations === 0,
      results,
      summary,
    };
  }

  /**
   * Vérifier l'impact de l'intégration avant de l'exécuter
   */
  static async previewIntegration(ministryId: string, fiscalYear: number) {
    // Récupérer les mesures validées
    const validatedMeasures = await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: 'VALIDATED',
      },
    });

    if (validatedMeasures.length === 0) {
      return {
        ministryId,
        fiscalYear,
        measuresToIntegrate: 0,
        impact: [],
        canProceed: false,
        message: 'Aucune mesure validée à intégrer',
      };
    }

    // Calculer les totaux
    const aggregated = validatedMeasures.reduce(
      (acc, m) => {
        acc.totalY1 += parseFloat(m.totalCostY1.toString());
        acc.totalY2 += parseFloat(m.totalCostY2.toString());
        acc.totalY3 += parseFloat(m.totalCostY3.toString());
        return acc;
      },
      { totalY1: 0, totalY2: 0, totalY3: 0 }
    );

    // Récupérer les plafonds actuels
    const years = [fiscalYear + 1, fiscalYear + 2, fiscalYear + 3];
    const impact = await Promise.all(
      years.map(async (year, index) => {
        const ceiling = await prisma.ministerialCeiling.findFirst({
          where: { ministryId, year },
          orderBy: { createdAt: 'desc' },
        });

        const newMeasuresAmount = [aggregated.totalY1, aggregated.totalY2, aggregated.totalY3][
          index
        ];

        if (!ceiling) {
          return {
            year,
            currentCeiling: 0,
            currentNewMeasures: 0,
            newMeasuresAmount,
            updatedNewMeasures: newMeasuresAmount,
            updatedCeiling: 0,
            delta: 0,
          };
        }

        const currentCeiling = parseFloat(ceiling.ceiling.toString());
        const currentNewMeasures = parseFloat(ceiling.newMeasures.toString());
        const baseline = parseFloat(ceiling.baseline.toString());
        const allocatedSpace = parseFloat(ceiling.allocatedSpace.toString());

        const updatedNewMeasures = currentNewMeasures + newMeasuresAmount;
        const updatedCeiling = baseline + updatedNewMeasures + allocatedSpace;
        const delta = updatedCeiling - currentCeiling;

        return {
          year,
          currentCeiling,
          currentNewMeasures,
          newMeasuresAmount,
          updatedNewMeasures,
          updatedCeiling,
          delta,
        };
      })
    );

    return {
      ministryId,
      fiscalYear,
      measuresToIntegrate: validatedMeasures.length,
      impact,
      canProceed: true,
      message: `${validatedMeasures.length} mesure(s) prête(s) à être intégrée(s)`,
    };
  }
}
