import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { TrendCalculationService } from './trendCalculation.service';

const prisma = new PrismaClient();

export class TrendBudgetService {
  // ============================================================================
  // TrendBudgetConfig CRUD
  // ============================================================================

  /**
   * Obtenir toutes les configurations de budget tendanciel
   */
  static async getAll(filters?: {
    fiscalYear?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.fiscalYear) where.fiscalYear = filters.fiscalYear;
    if (filters?.status) where.status = filters.status;

    const [data, totalItems] = await Promise.all([
      prisma.trendBudgetConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              historicalBudgets: true,
              trendProjections: true,
            },
          },
        },
      }),
      prisma.trendBudgetConfig.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Obtenir une configuration par ID
   */
  static async getById(id: string): Promise<any> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            historicalBudgets: true,
            trendProjections: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundError('Configuration de budget tendanciel non trouvée');
    }

    return config;
  }

  /**
   * Créer une configuration
   */
  static async create(data: {
    configCode: string;
    name: string;
    description?: string;
    fiscalYear: number;
    baselineStartYear: number;
    baselineEndYear: number;
    globalGrowthRate: number;
    projectionYears?: number;
    excludeTemporary?: boolean;
    createdBy?: string;
  }): Promise<any> {
    // Vérifier unicité du code
    const existing = await prisma.trendBudgetConfig.findUnique({
      where: { configCode: data.configCode },
    });

    if (existing) {
      throw new BadRequestError(`Le code ${data.configCode} est déjà utilisé`);
    }

    // Valider les années
    if (data.baselineStartYear > data.baselineEndYear) {
      throw new BadRequestError(
        "L'année de début doit être antérieure ou égale à l'année de fin"
      );
    }

    if (data.fiscalYear < data.baselineEndYear) {
      throw new BadRequestError(
        "L'année fiscale doit être postérieure à la période de référence"
      );
    }

    return await prisma.trendBudgetConfig.create({
      data: {
        configCode: data.configCode,
        name: data.name,
        description: data.description,
        fiscalYear: data.fiscalYear,
        baselineStartYear: data.baselineStartYear,
        baselineEndYear: data.baselineEndYear,
        globalGrowthRate: data.globalGrowthRate,
        projectionYears: data.projectionYears || 3,
        excludeTemporary: data.excludeTemporary ?? true,
        status: 'DRAFT',
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Mettre à jour une configuration
   */
  static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      fiscalYear?: number;
      baselineStartYear?: number;
      baselineEndYear?: number;
      globalGrowthRate?: number;
      projectionYears?: number;
      excludeTemporary?: boolean;
    }
  ): Promise<any> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    // Ne permettre la modification que si DRAFT
    if (config.status !== 'DRAFT') {
      throw new BadRequestError(
        'Seules les configurations en DRAFT peuvent être modifiées'
      );
    }

    // Valider les années si modifiées
    const newStartYear = data.baselineStartYear ?? config.baselineStartYear;
    const newEndYear = data.baselineEndYear ?? config.baselineEndYear;
    const newFiscalYear = data.fiscalYear ?? config.fiscalYear;

    if (newStartYear > newEndYear) {
      throw new BadRequestError(
        "L'année de début doit être antérieure ou égale à l'année de fin"
      );
    }

    if (newFiscalYear < newEndYear) {
      throw new BadRequestError(
        "L'année fiscale doit être postérieure à la période de référence"
      );
    }

    return await prisma.trendBudgetConfig.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer une configuration
   */
  static async delete(id: string): Promise<void> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    // Ne permettre la suppression que si DRAFT
    if (config.status !== 'DRAFT') {
      throw new BadRequestError('Seules les configurations en DRAFT peuvent être supprimées');
    }

    await prisma.trendBudgetConfig.delete({
      where: { id },
    });
  }

  /**
   * Valider une configuration (DRAFT → VALIDATED)
   */
  static async validate(id: string, userId: string): Promise<any> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    if (config.status !== 'DRAFT') {
      throw new BadRequestError('Seules les configurations en DRAFT peuvent être validées');
    }

    return await prisma.trendBudgetConfig.update({
      where: { id },
      data: {
        status: 'VALIDATED',
        validatedBy: userId,
        validatedAt: new Date(),
      },
    });
  }

  /**
   * Approuver une configuration (VALIDATED → APPROVED)
   */
  static async approve(id: string, userId: string): Promise<any> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    if (config.status !== 'VALIDATED') {
      throw new BadRequestError('Seules les configurations VALIDATED peuvent être approuvées');
    }

    return await prisma.trendBudgetConfig.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });
  }

  // ============================================================================
  // HistoricalBudget Operations
  // ============================================================================

  /**
   * Obtenir les budgets historiques d'une configuration
   */
  static async getHistoricalBudgets(
    trendConfigId: string,
    filters?: {
      ministryId?: string;
      fiscalYear?: number;
      isTemporary?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { trendConfigId };
    if (filters?.ministryId) where.ministryId = filters.ministryId;
    if (filters?.fiscalYear) where.fiscalYear = filters.fiscalYear;
    if (filters?.isTemporary !== undefined) where.isTemporary = filters.isTemporary;

    const [data, totalItems] = await Promise.all([
      prisma.historicalBudget.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ ministryId: 'asc' }, { fiscalYear: 'desc' }],
        include: {
          ministry: {
            select: {
              code: true,
              name: true,
              isPriority: true,
            },
          },
          program: {
            select: {
              code: true,
              name: true,
            },
          },
          economicNature: {
            select: {
              code: true,
              name: true,
            },
          },
          fundingSource: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.historicalBudget.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Créer un budget historique manuellement
   */
  static async createHistoricalBudget(data: {
    trendConfigId: string;
    ministryId: string;
    programId?: string;
    economicNatureId?: string;
    fundingSourceId?: string;
    fiscalYear: number;
    budgetAmount: number;
    executedAmount?: number;
    isTemporary?: boolean;
    notes?: string;
    userId: string;
  }): Promise<any> {
    // Vérifier que la config existe
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: data.trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    return await prisma.historicalBudget.create({
      data: {
        trendConfigId: data.trendConfigId,
        ministryId: data.ministryId,
        programId: data.programId || null,
        economicNatureId: data.economicNatureId || null,
        fundingSourceId: data.fundingSourceId || null,
        fiscalYear: data.fiscalYear,
        budgetAmount: data.budgetAmount,
        executedAmount: data.executedAmount || null,
        isTemporary: data.isTemporary || false,
        notes: data.notes || null,
        importSource: 'MANUAL',
        importedAt: new Date(),
        importedBy: data.userId,
      },
    });
  }

  /**
   * Mettre à jour un budget historique
   */
  static async updateHistoricalBudget(
    id: string,
    data: {
      budgetAmount?: number;
      executedAmount?: number;
      isTemporary?: boolean;
      notes?: string;
    }
  ): Promise<any> {
    const historical = await prisma.historicalBudget.findUnique({
      where: { id },
    });

    if (!historical) {
      throw new NotFoundError('Budget historique non trouvé');
    }

    return await prisma.historicalBudget.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un budget historique
   */
  static async deleteHistoricalBudget(id: string): Promise<void> {
    const historical = await prisma.historicalBudget.findUnique({
      where: { id },
    });

    if (!historical) {
      throw new NotFoundError('Budget historique non trouvé');
    }

    await prisma.historicalBudget.delete({
      where: { id },
    });
  }

  /**
   * Basculer le flag isTemporary
   */
  static async toggleTemporary(id: string): Promise<any> {
    const historical = await prisma.historicalBudget.findUnique({
      where: { id },
    });

    if (!historical) {
      throw new NotFoundError('Budget historique non trouvé');
    }

    return await prisma.historicalBudget.update({
      where: { id },
      data: {
        isTemporary: !historical.isTemporary,
      },
    });
  }

  // ============================================================================
  // TrendProjection Operations
  // ============================================================================

  /**
   * Obtenir les projections d'une configuration
   */
  static async getTrendProjections(
    trendConfigId: string,
    filters?: {
      ministryId?: string;
      isPriorityMinistry?: boolean;
      calculationMethod?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { trendConfigId };
    if (filters?.ministryId) where.ministryId = filters.ministryId;
    if (filters?.isPriorityMinistry !== undefined)
      where.isPriorityMinistry = filters.isPriorityMinistry;
    if (filters?.calculationMethod) where.calculationMethod = filters.calculationMethod;

    const [data, totalItems] = await Promise.all([
      prisma.trendProjection.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPriorityMinistry: 'desc' }, { ministryId: 'asc' }],
        include: {
          ministry: {
            select: {
              code: true,
              name: true,
              isPriority: true,
            },
          },
          program: {
            select: {
              code: true,
              name: true,
            },
          },
          economicNature: {
            select: {
              code: true,
              name: true,
            },
          },
          fundingSource: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.trendProjection.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Obtenir une projection par ID
   */
  static async getTrendProjectionById(id: string): Promise<any> {
    const projection = await prisma.trendProjection.findUnique({
      where: { id },
      include: {
        trendConfig: true,
        ministry: {
          select: {
            code: true,
            name: true,
            isPriority: true,
          },
        },
        program: {
          select: {
            code: true,
            name: true,
          },
        },
        economicNature: {
          select: {
            code: true,
            name: true,
          },
        },
        fundingSource: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (!projection) {
      throw new NotFoundError('Projection non trouvée');
    }

    return projection;
  }

  /**
   * Mettre à jour une projection manuellement
   */
  static async updateTrendProjection(
    id: string,
    data: {
      projectedAmount1?: number;
      growthRate1?: number;
      projectedAmount2?: number;
      growthRate2?: number;
      projectedAmount3?: number;
      growthRate3?: number;
      notes?: string;
    }
  ): Promise<any> {
    const projection = await prisma.trendProjection.findUnique({
      where: { id },
    });

    if (!projection) {
      throw new NotFoundError('Projection non trouvée');
    }

    return await prisma.trendProjection.update({
      where: { id },
      data: {
        ...data,
        calculationMethod: 'MANUAL',
      },
    });
  }

  /**
   * Recalculer une projection spécifique
   */
  static async recalculateProjection(id: string): Promise<any> {
    return await TrendCalculationService.recalculateProjection(id);
  }

  /**
   * Recalculer toutes les projections d'une configuration
   */
  static async recalculateAll(trendConfigId: string): Promise<{
    calculated: number;
    errors: any[];
  }> {
    return await TrendCalculationService.calculateProjections(trendConfigId);
  }
}
