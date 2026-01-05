import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { CDMTGlobalCalculationService } from './cdmtGlobalCalculation.service';

const prisma = new PrismaClient();

export class CDMTGlobalService {
  // ===== SCENARIO CRUD =====

  /**
   * Obtenir tous les scénarios avec filtres et pagination
   */
  static async getScenarios(filters?: {
    fiscalYear?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.fiscalYear) where.fiscalYear = filters.fiscalYear;
    if (filters?.status) where.status = filters.status;

    const [scenarios, total] = await Promise.all([
      prisma.cDMTGlobalScenario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          macroFramework: { select: { budgetYear: true } },
          trendConfig: { select: { name: true, fiscalYear: true } },
        },
      }),
      prisma.cDMTGlobalScenario.count({ where }),
    ]);

    return {
      scenarios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir un scénario par ID
   */
  static async getScenarioById(id: string) {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id },
      include: {
        macroFramework: true,
        trendConfig: true,
        policyMeasures: { include: { ministry: true } },
        marginAllocations: { include: { ministry: true } },
        ministerialCeilings: { include: { ministry: true } },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    return scenario;
  }

  /**
   * Créer un scénario
   */
  static async createScenario(data: {
    scenarioCode: string;
    name: string;
    description?: string;
    fiscalYear: number;
    macroFrameworkId: string;
    trendConfigId?: string;
    createdBy?: string;
  }) {
    // Vérifier l'unicité du code
    const existing = await prisma.cDMTGlobalScenario.findUnique({
      where: { scenarioCode: data.scenarioCode },
    });

    if (existing) {
      throw new BadRequestError('Un scénario avec ce code existe déjà');
    }

    // Calculer la marge fiscale depuis le cadre macro
    const fiscalMargin = await CDMTGlobalCalculationService.calculateFiscalMargin(
      data.macroFrameworkId
    );

    // Créer le scénario
    const scenario = await prisma.cDMTGlobalScenario.create({
      data: {
        scenarioCode: data.scenarioCode,
        name: data.name,
        description: data.description,
        fiscalYear: data.fiscalYear,
        macroFrameworkId: data.macroFrameworkId,
        trendConfigId: data.trendConfigId,
        fiscalMarginY1: fiscalMargin.marginY1,
        fiscalMarginY2: fiscalMargin.marginY2,
        fiscalMarginY3: fiscalMargin.marginY3,
        createdBy: data.createdBy,
      },
      include: {
        macroFramework: true,
        trendConfig: true,
      },
    });

    return scenario;
  }

  /**
   * Mettre à jour un scénario
   */
  static async updateScenario(
    id: string,
    data: {
      name?: string;
      description?: string;
      fiscalYear?: number;
      macroFrameworkId?: string;
      trendConfigId?: string;
    }
  ) {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (scenario.status === 'ACTIVE') {
      throw new BadRequestError('Impossible de modifier un scénario actif');
    }

    const updateData: any = { ...data };

    // Recalculer la marge fiscale si le macro framework change
    if (data.macroFrameworkId && data.macroFrameworkId !== scenario.macroFrameworkId) {
      const fiscalMargin = await CDMTGlobalCalculationService.calculateFiscalMargin(
        data.macroFrameworkId
      );
      updateData.fiscalMarginY1 = fiscalMargin.marginY1;
      updateData.fiscalMarginY2 = fiscalMargin.marginY2;
      updateData.fiscalMarginY3 = fiscalMargin.marginY3;
    }

    const updated = await prisma.cDMTGlobalScenario.update({
      where: { id },
      data: updateData,
      include: {
        macroFramework: true,
        trendConfig: true,
      },
    });

    return updated;
  }

  /**
   * Supprimer un scénario
   */
  static async deleteScenario(id: string) {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (scenario.status === 'ACTIVE') {
      throw new BadRequestError('Impossible de supprimer un scénario actif. Désactivez-le d\'abord.');
    }

    await prisma.cDMTGlobalScenario.delete({
      where: { id },
    });
  }

  /**
   * Dupliquer un scénario
   */
  static async duplicateScenario(id: string, newName: string, newCode: string) {
    const original = await this.getScenarioById(id);

    // Créer le nouveau scénario
    const newScenario = await prisma.cDMTGlobalScenario.create({
      data: {
        scenarioCode: newCode,
        name: newName,
        description: `Copie de: ${original.description || original.name}`,
        fiscalYear: original.fiscalYear,
        macroFrameworkId: original.macroFrameworkId,
        trendConfigId: original.trendConfigId,
        fiscalMarginY1: original.fiscalMarginY1,
        fiscalMarginY2: original.fiscalMarginY2,
        fiscalMarginY3: original.fiscalMarginY3,
        status: 'DRAFT',
        isActive: false,
      },
    });

    // Copier les mesures nouvelles
    for (const measure of original.policyMeasures) {
      await prisma.policyMeasure.create({
        data: {
          scenarioId: newScenario.id,
          ministryId: measure.ministryId,
          measureCode: measure.measureCode,
          measureName: measure.measureName,
          description: measure.description,
          category: measure.category,
          amountY1: measure.amountY1,
          amountY2: measure.amountY2,
          amountY3: measure.amountY3,
          justification: measure.justification,
          source: measure.source,
        },
      });
    }

    // Copier les allocations de marge
    for (const allocation of original.marginAllocations) {
      await prisma.marginAllocation.create({
        data: {
          scenarioId: newScenario.id,
          ministryId: allocation.ministryId,
          allocatedY1: allocation.allocatedY1,
          allocatedY2: allocation.allocatedY2,
          allocatedY3: allocation.allocatedY3,
          notes: allocation.notes,
          allocationMethod: allocation.allocationMethod,
        },
      });
    }

    // Recalculer les plafonds
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(newScenario.id);

    return await this.getScenarioById(newScenario.id);
  }

  /**
   * Activer un scénario
   */
  static async activateScenario(id: string, userId?: string) {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (scenario.isActive) {
      throw new BadRequestError('Ce scénario est déjà actif');
    }

    // Désactiver tous les autres scénarios
    await prisma.cDMTGlobalScenario.updateMany({
      where: { isActive: true },
      data: { isActive: false, status: 'ARCHIVED' },
    });

    // Activer ce scénario
    const updated = await prisma.cDMTGlobalScenario.update({
      where: { id },
      data: {
        isActive: true,
        status: 'ACTIVE',
        activatedAt: new Date(),
        activatedBy: userId,
      },
    });

    return updated;
  }

  /**
   * Désactiver un scénario
   */
  static async deactivateScenario(id: string) {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (!scenario.isActive) {
      throw new BadRequestError('Ce scénario n\'est pas actif');
    }

    const updated = await prisma.cDMTGlobalScenario.update({
      where: { id },
      data: {
        isActive: false,
        status: 'DRAFT',
      },
    });

    return updated;
  }

  /**
   * Archiver un scénario
   */
  static async archiveScenario(id: string) {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    if (scenario.isActive) {
      throw new BadRequestError('Impossible d\'archiver un scénario actif. Désactivez-le d\'abord.');
    }

    const updated = await prisma.cDMTGlobalScenario.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return updated;
  }

  // ===== POLICY MEASURES =====

  /**
   * Obtenir les mesures nouvelles d'un scénario
   */
  static async getPolicyMeasures(scenarioId: string, filters?: { ministryId?: string }) {
    const where: any = { scenarioId };
    if (filters?.ministryId) where.ministryId = filters.ministryId;

    const measures = await prisma.policyMeasure.findMany({
      where,
      include: { ministry: true },
      orderBy: { createdAt: 'desc' },
    });

    return measures;
  }

  /**
   * Créer une mesure nouvelle
   */
  static async createPolicyMeasure(data: {
    scenarioId: string;
    ministryId: string;
    measureCode?: string;
    measureName: string;
    description?: string;
    category?: string;
    amountY1: number;
    amountY2: number;
    amountY3: number;
    justification?: string;
    source?: string;
    createdBy?: string;
  }) {
    const measure = await prisma.policyMeasure.create({
      data,
      include: { ministry: true },
    });

    // Recalculer les plafonds
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(data.scenarioId);

    return measure;
  }

  /**
   * Mettre à jour une mesure nouvelle
   */
  static async updatePolicyMeasure(id: string, data: Partial<{
    measureName: string;
    description: string;
    category: string;
    amountY1: number;
    amountY2: number;
    amountY3: number;
    justification: string;
    source: string;
  }>) {
    const measure = await prisma.policyMeasure.findUnique({
      where: { id },
    });

    if (!measure) {
      throw new NotFoundError('Mesure nouvelle non trouvée');
    }

    const updated = await prisma.policyMeasure.update({
      where: { id },
      data,
      include: { ministry: true },
    });

    // Recalculer les plafonds
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(measure.scenarioId);

    return updated;
  }

  /**
   * Supprimer une mesure nouvelle
   */
  static async deletePolicyMeasure(id: string) {
    const measure = await prisma.policyMeasure.findUnique({
      where: { id },
    });

    if (!measure) {
      throw new NotFoundError('Mesure nouvelle non trouvée');
    }

    await prisma.policyMeasure.delete({
      where: { id },
    });

    // Recalculer les plafonds
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(measure.scenarioId);
  }

  /**
   * Import massif de mesures nouvelles
   */
  static async bulkImportPolicyMeasures(
    scenarioId: string,
    measures: Array<{
      ministryId: string;
      measureCode?: string;
      measureName: string;
      description?: string;
      category?: string;
      amountY1: number;
      amountY2: number;
      amountY3: number;
      justification?: string;
      source?: string;
    }>
  ) {
    const created = [];

    for (const measure of measures) {
      const result = await prisma.policyMeasure.create({
        data: {
          ...measure,
          scenarioId,
        },
        include: { ministry: true },
      });
      created.push(result);
    }

    // Recalculer les plafonds
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(scenarioId);

    return { imported: created.length, measures: created };
  }

  // ===== MARGIN ALLOCATION =====

  /**
   * Obtenir les allocations de marge d'un scénario
   */
  static async getMarginAllocations(scenarioId: string) {
    const allocations = await prisma.marginAllocation.findMany({
      where: { scenarioId },
      include: { ministry: true },
      orderBy: { ministry: { name: 'asc' } },
    });

    return allocations;
  }

  /**
   * Mettre à jour l'allocation de marge pour un ministère
   */
  static async updateMarginAllocation(
    scenarioId: string,
    ministryId: string,
    data: {
      allocatedY1?: number;
      allocatedY2?: number;
      allocatedY3?: number;
      notes?: string;
      allocationMethod?: string;
      createdBy?: string;
    }
  ) {
    const allocation = await prisma.marginAllocation.upsert({
      where: {
        scenarioId_ministryId: { scenarioId, ministryId },
      },
      create: {
        scenarioId,
        ministryId,
        ...data,
      },
      update: data,
      include: { ministry: true },
    });

    // Recalculer les plafonds
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(scenarioId);

    return allocation;
  }

  /**
   * Mise à jour multiple d'allocations
   */
  static async bulkUpdateMarginAllocations(
    scenarioId: string,
    allocations: Array<{
      ministryId: string;
      allocatedY1?: number;
      allocatedY2?: number;
      allocatedY3?: number;
      notes?: string;
    }>
  ) {
    const updated = [];

    for (const allocation of allocations) {
      const result = await this.updateMarginAllocation(
        scenarioId,
        allocation.ministryId,
        allocation
      );
      updated.push(result);
    }

    return { updated: updated.length, allocations: updated };
  }

  /**
   * Réinitialiser toutes les allocations à 0
   */
  static async resetMarginAllocations(scenarioId: string) {
    await prisma.marginAllocation.updateMany({
      where: { scenarioId },
      data: {
        allocatedY1: 0,
        allocatedY2: 0,
        allocatedY3: 0,
      },
    });

    // Recalculer les plafonds
    await CDMTGlobalCalculationService.calculateMinisterialCeilings(scenarioId);

    return { message: 'Allocations réinitialisées avec succès' };
  }

  /**
   * Obtenir la marge restante à allouer
   */
  static async getRemainingMargin(scenarioId: string) {
    const validation = await CDMTGlobalCalculationService.validateMarginAllocation(scenarioId);

    return {
      remainingY1: validation.remainingMarginY1,
      remainingY2: validation.remainingMarginY2,
      remainingY3: validation.remainingMarginY3,
      isValid: validation.isValid,
      warnings: validation.warnings,
    };
  }

  // ===== MINISTERIAL CEILINGS =====

  /**
   * Obtenir les plafonds ministériels d'un scénario
   */
  static async getMinisterialCeilings(scenarioId: string, filters?: {
    ministryId?: string;
    year?: number;
  }) {
    const where: any = { scenarioId };
    if (filters?.ministryId) where.ministryId = filters.ministryId;
    if (filters?.year) where.year = filters.year;

    const ceilings = await prisma.ministerialCeiling.findMany({
      where,
      include: { ministry: true },
      orderBy: [{ year: 'asc' }, { ministry: { name: 'asc' } }],
    });

    return ceilings;
  }

  /**
   * Obtenir le plafond d'un ministère pour un scénario
   */
  static async getMinisterialCeilingByMinistry(scenarioId: string, ministryId: string) {
    const ceilings = await prisma.ministerialCeiling.findMany({
      where: { scenarioId, ministryId },
      include: { ministry: true },
      orderBy: { year: 'asc' },
    });

    return ceilings;
  }

  /**
   * Recalculer tous les plafonds d'un scénario
   */
  static async recalculateCeilings(scenarioId: string) {
    const result = await CDMTGlobalCalculationService.calculateMinisterialCeilings(scenarioId);
    return result;
  }

  // ===== COMPARISON =====

  /**
   * Comparer plusieurs scénarios
   */
  static async compareScenarios(scenarioIds: string[]) {
    const scenarios = await Promise.all(
      scenarioIds.map((id) => this.getScenarioById(id))
    );

    const comparison: any = {
      scenarios: scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        scenarioCode: s.scenarioCode,
        fiscalYear: s.fiscalYear,
      })),
      ministries: [],
    };

    // Obtenir tous les ministères
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    for (const ministry of ministries) {
      const ministryData: any = {
        ministryId: ministry.id,
        ministryName: ministry.name,
        scenarios: [],
      };

      for (const scenario of scenarios) {
        const ceilings = await this.getMinisterialCeilingByMinistry(scenario.id, ministry.id);

        ministryData.scenarios.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          ceilings: ceilings.map((c) => ({
            year: c.year,
            baseline: parseFloat(c.baseline.toString()),
            newMeasures: parseFloat(c.newMeasures.toString()),
            allocatedSpace: parseFloat(c.allocatedSpace.toString()),
            ceiling: parseFloat(c.ceiling.toString()),
          })),
        });
      }

      comparison.ministries.push(ministryData);
    }

    return comparison;
  }

  /**
   * Obtenir les différences détaillées entre deux scénarios
   */
  static async getScenarioDifferences(scenario1Id: string, scenario2Id: string) {
    const [scenario1, scenario2] = await Promise.all([
      this.getScenarioById(scenario1Id),
      this.getScenarioById(scenario2Id),
    ]);

    const differences: any = {
      scenario1: { id: scenario1.id, name: scenario1.name },
      scenario2: { id: scenario2.id, name: scenario2.name },
      fiscalMargin: {
        y1: {
          scenario1: parseFloat(scenario1.fiscalMarginY1.toString()),
          scenario2: parseFloat(scenario2.fiscalMarginY2.toString()),
          diff: parseFloat(scenario1.fiscalMarginY1.toString()) - parseFloat(scenario2.fiscalMarginY1.toString()),
        },
        y2: {
          scenario1: parseFloat(scenario1.fiscalMarginY2.toString()),
          scenario2: parseFloat(scenario2.fiscalMarginY2.toString()),
          diff: parseFloat(scenario1.fiscalMarginY2.toString()) - parseFloat(scenario2.fiscalMarginY2.toString()),
        },
        y3: {
          scenario1: parseFloat(scenario1.fiscalMarginY3.toString()),
          scenario2: parseFloat(scenario2.fiscalMarginY3.toString()),
          diff: parseFloat(scenario1.fiscalMarginY3.toString()) - parseFloat(scenario2.fiscalMarginY3.toString()),
        },
      },
      ceilings: [],
    };

    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
    });

    for (const ministry of ministries) {
      const [ceilings1, ceilings2] = await Promise.all([
        this.getMinisterialCeilingByMinistry(scenario1.id, ministry.id),
        this.getMinisterialCeilingByMinistry(scenario2.id, ministry.id),
      ]);

      differences.ceilings.push({
        ministryId: ministry.id,
        ministryName: ministry.name,
        years: ceilings1.map((c1, index) => {
          const c2 = ceilings2[index];
          return {
            year: c1.year,
            scenario1: {
              baseline: parseFloat(c1.baseline.toString()),
              newMeasures: parseFloat(c1.newMeasures.toString()),
              allocatedSpace: parseFloat(c1.allocatedSpace.toString()),
              ceiling: parseFloat(c1.ceiling.toString()),
            },
            scenario2: c2 ? {
              baseline: parseFloat(c2.baseline.toString()),
              newMeasures: parseFloat(c2.newMeasures.toString()),
              allocatedSpace: parseFloat(c2.allocatedSpace.toString()),
              ceiling: parseFloat(c2.ceiling.toString()),
            } : null,
            diff: c2 ? parseFloat(c1.ceiling.toString()) - parseFloat(c2.ceiling.toString()) : null,
          };
        }),
      });
    }

    return differences;
  }
}
