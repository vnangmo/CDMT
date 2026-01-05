import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateRevenueProjectionData {
  macroFrameworkId: string;
  revenueType: string;
  categoryCode: string;
  categoryName: string;
  baseYear: number;
  baseAmount: Decimal;
  projectionYear1: number;
  projectedAmount1?: Decimal;
  growthRate1?: Decimal;
  adjustmentFactor1?: Decimal;
  projectionYear2: number;
  projectedAmount2?: Decimal;
  growthRate2?: Decimal;
  adjustmentFactor2?: Decimal;
  projectionYear3?: number;
  projectedAmount3?: Decimal;
  growthRate3?: Decimal;
  adjustmentFactor3?: Decimal;
  calculationMethod?: string;
  notes?: string;
}

interface UpdateRevenueProjectionData {
  revenueType?: string;
  categoryCode?: string;
  categoryName?: string;
  baseYear?: number;
  baseAmount?: Decimal;
  projectionYear1?: number;
  projectedAmount1?: Decimal;
  growthRate1?: Decimal;
  adjustmentFactor1?: Decimal;
  projectionYear2?: number;
  projectedAmount2?: Decimal;
  growthRate2?: Decimal;
  adjustmentFactor2?: Decimal;
  projectionYear3?: number;
  projectedAmount3?: Decimal;
  growthRate3?: Decimal;
  adjustmentFactor3?: Decimal;
  calculationMethod?: string;
  notes?: string;
  isActive?: boolean;
}

export class RevenueProjectionService {
  /**
   * Obtenir toutes les projections de recettes
   */
  static async getAll(filters?: {
    macroFrameworkId?: string;
    revenueType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      macroFrameworkId,
      revenueType,
      isActive,
      page = 1,
      limit = 100,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (macroFrameworkId) {
      where.macroFrameworkId = macroFrameworkId;
    }

    if (revenueType) {
      where.revenueType = revenueType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [projections, total] = await Promise.all([
      prisma.revenueProjection.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { revenueType: 'asc' },
          { categoryCode: 'asc' },
        ],
        include: {
          macroFramework: true,
        },
      }),
      prisma.revenueProjection.count({ where }),
    ]);

    return {
      data: projections,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une projection de recettes par ID
   */
  static async getById(id: string) {
    const projection = await prisma.revenueProjection.findUnique({
      where: { id },
      include: {
        macroFramework: true,
      },
    });

    if (!projection) {
      throw new NotFoundError('Projection de recettes non trouvée');
    }

    return projection;
  }

  /**
   * Obtenir les projections par cadre macroéconomique
   */
  static async getByMacroFramework(macroFrameworkId: string) {
    return await prisma.revenueProjection.findMany({
      where: { macroFrameworkId },
      orderBy: [
        { revenueType: 'asc' },
        { categoryCode: 'asc' },
      ],
      include: {
        macroFramework: true,
      },
    });
  }

  /**
   * Créer une projection de recettes
   */
  static async create(data: CreateRevenueProjectionData) {
    // Vérifier si le cadre macro existe
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: data.macroFrameworkId },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Vérifier si une projection existe déjà pour cette catégorie
    const existing = await prisma.revenueProjection.findUnique({
      where: {
        macroFrameworkId_categoryCode: {
          macroFrameworkId: data.macroFrameworkId,
          categoryCode: data.categoryCode,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Une projection existe déjà pour cette catégorie');
    }

    // Calculer les projections si non fournies
    const calculatedData = await this.calculateProjectionAmounts(data, macroFramework);

    return await prisma.revenueProjection.create({
      data: calculatedData,
      include: {
        macroFramework: true,
      },
    });
  }

  /**
   * Créer plusieurs projections en masse
   */
  static async createBulk(macroFrameworkId: string, projections: CreateRevenueProjectionData[]) {
    // Vérifier si le cadre macro existe
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    const results = [];

    for (const projectionData of projections) {
      const data = { ...projectionData, macroFrameworkId };
      const calculatedData = await this.calculateProjectionAmounts(data, macroFramework);

      const projection = await prisma.revenueProjection.create({
        data: calculatedData,
        include: {
          macroFramework: true,
        },
      });

      results.push(projection);
    }

    return results;
  }

  /**
   * Mettre à jour une projection de recettes
   */
  static async update(id: string, data: UpdateRevenueProjectionData) {
    const projection = await this.getById(id);

    // Vérifier si le nouveau categoryCode n'est pas déjà utilisé
    if (data.categoryCode) {
      const existing = await prisma.revenueProjection.findFirst({
        where: {
          macroFrameworkId: projection.macroFrameworkId,
          categoryCode: data.categoryCode,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Une projection existe déjà pour cette catégorie');
      }
    }

    // Recalculer si nécessaire
    let updateData = { ...data };
    if (data.baseAmount !== undefined || data.adjustmentFactor1 !== undefined || data.adjustmentFactor2 !== undefined || data.adjustmentFactor3 !== undefined) {
      const macroFramework = await prisma.macroFramework.findUnique({
        where: { id: projection.macroFrameworkId },
      });

      if (macroFramework) {
        const calculatedData = await this.calculateProjectionAmounts(
          { ...projection, ...data } as any,
          macroFramework
        );
        updateData = { ...updateData, ...calculatedData };
      }
    }

    return await prisma.revenueProjection.update({
      where: { id },
      data: updateData,
      include: {
        macroFramework: true,
      },
    });
  }

  /**
   * Supprimer une projection de recettes
   */
  static async delete(id: string) {
    await this.getById(id);

    return await prisma.revenueProjection.delete({
      where: { id },
    });
  }

  /**
   * Recalculer une projection
   */
  static async calculateProjection(id: string) {
    const projection = await this.getById(id);
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: projection.macroFrameworkId },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    const calculatedData = await this.calculateProjectionAmounts(projection as any, macroFramework);

    return await prisma.revenueProjection.update({
      where: { id },
      data: calculatedData,
      include: {
        macroFramework: true,
      },
    });
  }

  /**
   * Recalculer toutes les projections d'un cadre macro
   */
  static async recalculateAll(macroFrameworkId: string) {
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    const projections = await prisma.revenueProjection.findMany({
      where: { macroFrameworkId },
    });

    const results = [];

    for (const projection of projections) {
      const calculatedData = await this.calculateProjectionAmounts(projection as any, macroFramework);

      const updated = await prisma.revenueProjection.update({
        where: { id: projection.id },
        data: calculatedData,
        include: {
          macroFramework: true,
        },
      });

      results.push(updated);
    }

    return results;
  }

  /**
   * Obtenir le résumé des projections
   */
  static async getSummary(macroFrameworkId: string) {
    const projections = await prisma.revenueProjection.findMany({
      where: {
        macroFrameworkId,
        isActive: true,
      },
    });

    const summary = {
      byType: {} as Record<string, any>,
      byYear: {
        base: new Decimal(0),
        year1: new Decimal(0),
        year2: new Decimal(0),
        year3: new Decimal(0),
      },
      total: {
        base: new Decimal(0),
        year1: new Decimal(0),
        year2: new Decimal(0),
        year3: new Decimal(0),
      },
    };

    for (const projection of projections) {
      const type = projection.revenueType;

      // Initialiser le type si nécessaire
      if (!summary.byType[type]) {
        summary.byType[type] = {
          base: new Decimal(0),
          year1: new Decimal(0),
          year2: new Decimal(0),
          year3: new Decimal(0),
        };
      }

      // Ajouter aux totaux par type
      summary.byType[type].base = summary.byType[type].base.add(projection.baseAmount);
      summary.byType[type].year1 = summary.byType[type].year1.add(projection.projectedAmount1);
      summary.byType[type].year2 = summary.byType[type].year2.add(projection.projectedAmount2);
      if (projection.projectedAmount3) {
        summary.byType[type].year3 = summary.byType[type].year3.add(projection.projectedAmount3);
      }

      // Ajouter aux totaux généraux
      summary.total.base = summary.total.base.add(projection.baseAmount);
      summary.total.year1 = summary.total.year1.add(projection.projectedAmount1);
      summary.total.year2 = summary.total.year2.add(projection.projectedAmount2);
      if (projection.projectedAmount3) {
        summary.total.year3 = summary.total.year3.add(projection.projectedAmount3);
      }
    }

    summary.byYear = {
      base: summary.total.base,
      year1: summary.total.year1,
      year2: summary.total.year2,
      year3: summary.total.year3,
    };

    return summary;
  }

  /**
   * Calculer les montants projetés basés sur le cadre macro
   * Formule pour recettes fiscales: montant = montant_base * (1 + (taux_croissance_PIB / 100) + (facteur_ajustement / 100))
   */
  private static async calculateProjectionAmounts(
    data: CreateRevenueProjectionData,
    macroFramework: any
  ): Promise<any> {
    const gdpGrowthRate = Number(macroFramework.gdpGrowthRate);
    const baseAmount = Number(data.baseAmount);

    // Calculer Année 1
    const adjustmentFactor1 = data.adjustmentFactor1 ? Number(data.adjustmentFactor1) : 0;
    const growthRate1 = gdpGrowthRate + adjustmentFactor1;
    const projectedAmount1 = data.projectedAmount1
      ? Number(data.projectedAmount1)
      : baseAmount * (1 + (growthRate1 / 100));

    // Calculer Année 2
    const adjustmentFactor2 = data.adjustmentFactor2 ? Number(data.adjustmentFactor2) : 0;
    const growthRate2 = gdpGrowthRate + adjustmentFactor2;
    const projectedAmount2 = data.projectedAmount2
      ? Number(data.projectedAmount2)
      : projectedAmount1 * (1 + (growthRate2 / 100));

    // Calculer Année 3 (optionnel)
    let projectedAmount3 = data.projectedAmount3 ? Number(data.projectedAmount3) : null;
    let growthRate3 = null;
    if (data.projectionYear3) {
      const adjustmentFactor3 = data.adjustmentFactor3 ? Number(data.adjustmentFactor3) : 0;
      growthRate3 = gdpGrowthRate + adjustmentFactor3;
      projectedAmount3 = projectedAmount3 || projectedAmount2 * (1 + (growthRate3 / 100));
    }

    return {
      ...data,
      projectedAmount1: new Decimal(projectedAmount1),
      growthRate1: new Decimal(growthRate1),
      projectedAmount2: new Decimal(projectedAmount2),
      growthRate2: new Decimal(growthRate2),
      projectedAmount3: projectedAmount3 ? new Decimal(projectedAmount3) : null,
      growthRate3: growthRate3 ? new Decimal(growthRate3) : null,
    };
  }
}
