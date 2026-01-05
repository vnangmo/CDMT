import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class CDMTGlobalCBMTIntegrationService {
  /**
   * Synchroniser les plafonds ministériels vers CBMT
   */
  static async syncCeilingsToCBMT(scenarioId: string): Promise<{
    synced: number;
    updated: number;
    created: number;
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        ministerialCeilings: {
          include: { ministry: true },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (!scenario.isActive) {
      throw new BadRequestError('Seul le scénario actif peut être synchronisé vers CBMT');
    }

    // Trouver ou créer un document CBMT correspondant
    let cbmtDocument = await prisma.cBMTDocument.findFirst({
      where: {
        fiscalYear: scenario.fiscalYear,
        status: { in: ['DRAFT', 'IN_PROGRESS'] },
      },
    });

    if (!cbmtDocument) {
      // Créer un nouveau document CBMT
      cbmtDocument = await prisma.cBMTDocument.create({
        data: {
          documentCode: `CBMT-${scenario.fiscalYear}`,
          title: `CBMT ${scenario.fiscalYear} (depuis CDMT Global)`,
          fiscalYear: scenario.fiscalYear,
          macroFrameworkId: scenario.macroFrameworkId,
          totalRevenueCeiling: 0,
          totalExpenseCeiling: 0,
          status: 'DRAFT',
        },
      });
    }

    let synced = 0;
    let updated = 0;
    let created = 0;

    // Synchroniser les plafonds vers les agrégats CBMT
    for (const ceiling of scenario.ministerialCeilings) {
      // Créer ou mettre à jour un agrégat CBMT pour ce ministère et cette année
      const existing = await prisma.cBMTAggregate.findFirst({
        where: {
          cbmtDocumentId: cbmtDocument.id,
          categoryCode: `MIN-${ceiling.ministryId}`,
        },
      });

      if (existing) {
        // Mettre à jour l'agrégat existant
        await prisma.cBMTAggregate.update({
          where: { id: existing.id },
          data: {
            amount1: ceiling.ceiling,
            notes: `Synchronisé depuis CDMT Global Scénario: ${scenario.name}`,
          },
        });
        updated++;
      } else {
        // Créer un nouvel agrégat
        await prisma.cBMTAggregate.create({
          data: {
            cbmtDocumentId: cbmtDocument.id,
            aggregateType: 'EXPENSE',
            categoryCode: `MIN-${ceiling.ministryId}`,
            categoryName: `Plafond ministère ${ceiling.ministryId}`,
            baseYear: scenario.fiscalYear - 1,
            year1: ceiling.year,
            year2: ceiling.year + 1,
            year3: ceiling.year + 2,
            amount1: ceiling.ceiling,
            amount2: ceiling.ceiling,
            amount3: ceiling.ceiling,
            notes: `Créé depuis CDMT Global Scénario: ${scenario.name}`,
          },
        });
        created++;
      }

      synced++;
    }

    return { synced, updated, created };
  }

  /**
   * Créer un nouveau document CBMT depuis un scénario actif
   */
  static async createCBMTFromScenario(scenarioId: string, data?: {
    title?: string;
    description?: string;
    createdBy?: string;
  }): Promise<any> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        ministerialCeilings: {
          include: { ministry: true },
        },
        macroFramework: true,
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (!scenario.isActive) {
      throw new BadRequestError('Seul le scénario actif peut créer un CBMT');
    }

    // Créer le document CBMT
    const cbmtDocument = await prisma.cBMTDocument.create({
      data: {
        documentCode: `CBMT-${scenario.fiscalYear}-${Date.now()}`,
        title: data?.title || `CBMT ${scenario.fiscalYear} (depuis ${scenario.name})`,
        description: data?.description || `Document CBMT généré depuis le scénario CDMT Global: ${scenario.name}`,
        fiscalYear: scenario.fiscalYear,
        macroFrameworkId: scenario.macroFrameworkId,
        totalRevenueCeiling: 0,
        totalExpenseCeiling: 0,
        status: 'DRAFT',
        createdBy: data?.createdBy,
      },
    });

    // Créer les agrégats CBMT depuis les plafonds ministériels
    const aggregates = [];
    for (const ceiling of scenario.ministerialCeilings) {
      const aggregate = await prisma.cBMTAggregate.create({
        data: {
          cbmtDocumentId: cbmtDocument.id,
          aggregateType: 'EXPENSE',
          categoryCode: `MIN-${ceiling.ministryId}`,
          categoryName: `Plafond ministère ${ceiling.ministryId}`,
          baseYear: scenario.fiscalYear - 1,
          year1: ceiling.year,
          year2: ceiling.year + 1,
          year3: ceiling.year + 2,
          amount1: ceiling.ceiling,
          amount2: ceiling.ceiling,
          amount3: ceiling.ceiling,
          baseAmount: ceiling.baseline,
          notes: `Plafond ministériel: ${ceiling.ceiling} (Baseline: ${ceiling.baseline}, Mesures: ${ceiling.newMeasures}, Marge: ${ceiling.allocatedSpace})`,
        },
      });
      aggregates.push(aggregate);
    }

    return {
      cbmtDocument,
      aggregates,
      message: `Document CBMT créé avec ${aggregates.length} agrégats`,
    };
  }

  /**
   * Valider la cohérence entre plafonds ministériels et agrégats CBMT
   */
  static async validateCBMTCoherence(
    scenarioId: string,
    cbmtDocumentId: string
  ): Promise<{
    isCoherent: boolean;
    gaps: Array<{
      ministryId: string;
      ministryName: string;
      year: number;
      cdmtGlobalCeiling: number;
      cbmtAggregate: number;
      gap: number;
    }>;
    warnings: string[];
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        ministerialCeilings: {
          include: { ministry: true },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    const cbmtDocument = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
      },
    });

    if (!cbmtDocument) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const gaps: any[] = [];
    const warnings: string[] = [];

    // Vérifier pour chaque plafond ministériel
    for (const ceiling of scenario.ministerialCeilings) {
      const cbmtAggregate = cbmtDocument.aggregates.find(
        (agg: any) => agg.categoryCode === `MIN-${ceiling.ministryId}` && agg.year1 === ceiling.year
      );

      if (!cbmtAggregate) {
        warnings.push(
          `Plafond ministériel manquant dans CBMT: ${ceiling.ministry.name} - Année ${ceiling.year}`
        );
        gaps.push({
          ministryId: ceiling.ministryId,
          ministryName: ceiling.ministry.name,
          year: ceiling.year,
          cdmtGlobalCeiling: parseFloat(ceiling.ceiling.toString()),
          cbmtAggregate: 0,
          gap: parseFloat(ceiling.ceiling.toString()),
        });
      } else {
        const ceilingAmount = parseFloat(ceiling.ceiling.toString());
        const cbmtAmount = parseFloat(((cbmtAggregate as any).projectedAmount || cbmtAggregate.amount1).toString());
        const gap = ceilingAmount - cbmtAmount;

        if (Math.abs(gap) > 0.01) {
          // Tolérance de 0.01
          gaps.push({
            ministryId: ceiling.ministryId,
            ministryName: ceiling.ministry.name,
            year: ceiling.year,
            cdmtGlobalCeiling: ceilingAmount,
            cbmtAggregate: cbmtAmount,
            gap,
          });

          warnings.push(
            `Écart détecté pour ${ceiling.ministry.name} - Année ${ceiling.year}: ${gap.toFixed(2)}`
          );
        }
      }
    }

    return {
      isCoherent: gaps.length === 0,
      gaps,
      warnings,
    };
  }
}
