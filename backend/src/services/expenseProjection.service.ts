import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateExpenseProjectionData {
  macroFrameworkId: string;
  expenseType: string;
  categoryCode: string;
  categoryName: string;
  ministryId?: string;
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

interface UpdateExpenseProjectionData {
  expenseType?: string;
  categoryCode?: string;
  categoryName?: string;
  ministryId?: string;
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

export class ExpenseProjectionService {
  /**
   * Obtenir toutes les projections de dépenses
   */
  static async getAll(filters?: {
    macroFrameworkId?: string;
    expenseType?: string;
    ministryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      macroFrameworkId,
      expenseType,
      ministryId,
      isActive,
      page = 1,
      limit = 100,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (macroFrameworkId) {
      where.macroFrameworkId = macroFrameworkId;
    }

    if (expenseType) {
      where.expenseType = expenseType;
    }

    if (ministryId) {
      where.ministryId = ministryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [projections, total] = await Promise.all([
      prisma.expenseProjection.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { expenseType: 'asc' },
          { categoryCode: 'asc' },
        ],
        include: {
          macroFramework: true,
          ministry: true,
        },
      }),
      prisma.expenseProjection.count({ where }),
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
   * Obtenir une projection de dépenses par ID
   */
  static async getById(id: string) {
    const projection = await prisma.expenseProjection.findUnique({
      where: { id },
      include: {
        macroFramework: true,
        ministry: true,
      },
    });

    if (!projection) {
      throw new NotFoundError('Projection de dépenses non trouvée');
    }

    return projection;
  }

  /**
   * Obtenir les projections par cadre macroéconomique
   */
  static async getByMacroFramework(macroFrameworkId: string) {
    return await prisma.expenseProjection.findMany({
      where: { macroFrameworkId },
      orderBy: [
        { expenseType: 'asc' },
        { categoryCode: 'asc' },
      ],
      include: {
        macroFramework: true,
        ministry: true,
      },
    });
  }

  /**
   * Obtenir les projections par ministère
   */
  static async getByMinistry(macroFrameworkId: string, ministryId: string) {
    return await prisma.expenseProjection.findMany({
      where: {
        macroFrameworkId,
        ministryId,
      },
      orderBy: [
        { expenseType: 'asc' },
        { categoryCode: 'asc' },
      ],
      include: {
        macroFramework: true,
        ministry: true,
      },
    });
  }

  /**
   * Créer une projection de dépenses
   */
  static async create(data: CreateExpenseProjectionData) {
    // Vérifier si le cadre macro existe
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: data.macroFrameworkId },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Vérifier si le ministère existe (si fourni)
    if (data.ministryId) {
      const ministry = await prisma.ministry.findUnique({
        where: { id: data.ministryId },
      });

      if (!ministry) {
        throw new NotFoundError('Ministère non trouvé');
      }
    }

    // Vérifier si une projection existe déjà pour cette catégorie et ce ministère
    const existing = await prisma.expenseProjection.findUnique({
      where: {
        macroFrameworkId_categoryCode_ministryId: {
          macroFrameworkId: data.macroFrameworkId,
          categoryCode: data.categoryCode,
          ministryId: data.ministryId || '',
        },
      },
    });

    if (existing) {
      throw new ConflictError('Une projection existe déjà pour cette catégorie et ce ministère');
    }

    // Calculer les projections si non fournies
    const calculatedData = await this.calculateProjectionAmounts(data, macroFramework);

    return await prisma.expenseProjection.create({
      data: calculatedData,
      include: {
        macroFramework: true,
        ministry: true,
      },
    });
  }

  /**
   * Créer plusieurs projections en masse
   */
  static async createBulk(macroFrameworkId: string, projections: CreateExpenseProjectionData[]) {
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

      const projection = await prisma.expenseProjection.create({
        data: calculatedData,
        include: {
          macroFramework: true,
          ministry: true,
        },
      });

      results.push(projection);
    }

    return results;
  }

  /**
   * Mettre à jour une projection de dépenses
   */
  static async update(id: string, data: UpdateExpenseProjectionData) {
    const projection = await this.getById(id);

    // Vérifier si le nouveau categoryCode/ministryId n'est pas déjà utilisé
    if (data.categoryCode || data.ministryId !== undefined) {
      const categoryCode = data.categoryCode || projection.categoryCode;
      const ministryId = data.ministryId !== undefined ? data.ministryId : projection.ministryId;

      const existing = await prisma.expenseProjection.findFirst({
        where: {
          macroFrameworkId: projection.macroFrameworkId,
          categoryCode,
          ministryId: ministryId || null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Une projection existe déjà pour cette catégorie et ce ministère');
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

    return await prisma.expenseProjection.update({
      where: { id },
      data: updateData,
      include: {
        macroFramework: true,
        ministry: true,
      },
    });
  }

  /**
   * Supprimer une projection de dépenses
   */
  static async delete(id: string) {
    await this.getById(id);

    return await prisma.expenseProjection.delete({
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

    return await prisma.expenseProjection.update({
      where: { id },
      data: calculatedData,
      include: {
        macroFramework: true,
        ministry: true,
      },
    });
  }

  /**
   * Obtenir le résumé des projections
   */
  static async getSummary(macroFrameworkId: string) {
    const projections = await prisma.expenseProjection.findMany({
      where: {
        macroFrameworkId,
        isActive: true,
      },
      include: {
        ministry: true,
      },
    });

    const summary = {
      byType: {} as Record<string, any>,
      byMinistry: {} as Record<string, any>,
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
      const type = projection.expenseType;
      const ministryName = projection.ministry?.name || 'Non attribué';

      // Initialiser le type si nécessaire
      if (!summary.byType[type]) {
        summary.byType[type] = {
          base: new Decimal(0),
          year1: new Decimal(0),
          year2: new Decimal(0),
          year3: new Decimal(0),
        };
      }

      // Initialiser le ministère si nécessaire
      if (!summary.byMinistry[ministryName]) {
        summary.byMinistry[ministryName] = {
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

      // Ajouter aux totaux par ministère
      summary.byMinistry[ministryName].base = summary.byMinistry[ministryName].base.add(projection.baseAmount);
      summary.byMinistry[ministryName].year1 = summary.byMinistry[ministryName].year1.add(projection.projectedAmount1);
      summary.byMinistry[ministryName].year2 = summary.byMinistry[ministryName].year2.add(projection.projectedAmount2);
      if (projection.projectedAmount3) {
        summary.byMinistry[ministryName].year3 = summary.byMinistry[ministryName].year3.add(projection.projectedAmount3);
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
   * Obtenir le solde budgétaire (recettes - dépenses)
   */
  static async getFiscalBalance(macroFrameworkId: string) {
    // Récupérer les totaux de recettes
    const revenueProjections = await prisma.revenueProjection.findMany({
      where: {
        macroFrameworkId,
        isActive: true,
      },
    });

    // Récupérer les totaux de dépenses
    const expenseProjections = await prisma.expenseProjection.findMany({
      where: {
        macroFrameworkId,
        isActive: true,
      },
    });

    // Calculer les totaux
    const revenues = {
      base: revenueProjections.reduce((sum, p) => sum.add(p.baseAmount), new Decimal(0)),
      year1: revenueProjections.reduce((sum, p) => sum.add(p.projectedAmount1), new Decimal(0)),
      year2: revenueProjections.reduce((sum, p) => sum.add(p.projectedAmount2), new Decimal(0)),
      year3: revenueProjections.reduce((sum, p) => p.projectedAmount3 ? sum.add(p.projectedAmount3) : sum, new Decimal(0)),
    };

    const expenses = {
      base: expenseProjections.reduce((sum, p) => sum.add(p.baseAmount), new Decimal(0)),
      year1: expenseProjections.reduce((sum, p) => sum.add(p.projectedAmount1), new Decimal(0)),
      year2: expenseProjections.reduce((sum, p) => sum.add(p.projectedAmount2), new Decimal(0)),
      year3: expenseProjections.reduce((sum, p) => p.projectedAmount3 ? sum.add(p.projectedAmount3) : sum, new Decimal(0)),
    };

    const balance = {
      base: revenues.base.minus(expenses.base),
      year1: revenues.year1.minus(expenses.year1),
      year2: revenues.year2.minus(expenses.year2),
      year3: revenues.year3.minus(expenses.year3),
    };

    // Calculer les indicateurs
    const balanceToRevenueRatio = {
      base: revenues.base.isZero() ? 0 : balance.base.dividedBy(revenues.base).times(100).toNumber(),
      year1: revenues.year1.isZero() ? 0 : balance.year1.dividedBy(revenues.year1).times(100).toNumber(),
      year2: revenues.year2.isZero() ? 0 : balance.year2.dividedBy(revenues.year2).times(100).toNumber(),
      year3: revenues.year3.isZero() ? 0 : balance.year3.dividedBy(revenues.year3).times(100).toNumber(),
    };

    return {
      revenues,
      expenses,
      balance,
      balanceToRevenueRatio,
      isSurplus: {
        base: balance.base.greaterThan(0),
        year1: balance.year1.greaterThan(0),
        year2: balance.year2.greaterThan(0),
        year3: balance.year3.greaterThan(0),
      },
      isDeficitConcerning: {
        base: balance.base.lessThan(0) && Math.abs(balanceToRevenueRatio.base) > 5,
        year1: balance.year1.lessThan(0) && Math.abs(balanceToRevenueRatio.year1) > 5,
        year2: balance.year2.lessThan(0) && Math.abs(balanceToRevenueRatio.year2) > 5,
        year3: balance.year3.lessThan(0) && Math.abs(balanceToRevenueRatio.year3) > 5,
      },
    };
  }

  /**
   * Calculer les montants projetés basés sur le cadre macro
   * Formule pour dépenses de personnel: montant = montant_base * (1 + ((taux_inflation + 2%) / 100) + (facteur_ajustement / 100))
   */
  private static async calculateProjectionAmounts(
    data: CreateExpenseProjectionData,
    macroFramework: any
  ): Promise<any> {
    const inflationRate = Number(macroFramework.inflationRate);
    const baseAmount = Number(data.baseAmount);

    // Pour les dépenses de personnel, on ajoute 2% de croissance réelle
    const baseGrowthRate = data.expenseType === 'PERSONNEL' ? inflationRate + 2.0 : inflationRate;

    // Calculer Année 1
    const adjustmentFactor1 = data.adjustmentFactor1 ? Number(data.adjustmentFactor1) : 0;
    const growthRate1 = baseGrowthRate + adjustmentFactor1;
    const projectedAmount1 = data.projectedAmount1
      ? Number(data.projectedAmount1)
      : baseAmount * (1 + (growthRate1 / 100));

    // Calculer Année 2
    const adjustmentFactor2 = data.adjustmentFactor2 ? Number(data.adjustmentFactor2) : 0;
    const growthRate2 = baseGrowthRate + adjustmentFactor2;
    const projectedAmount2 = data.projectedAmount2
      ? Number(data.projectedAmount2)
      : projectedAmount1 * (1 + (growthRate2 / 100));

    // Calculer Année 3 (optionnel)
    let projectedAmount3 = data.projectedAmount3 ? Number(data.projectedAmount3) : null;
    let growthRate3 = null;
    if (data.projectionYear3) {
      const adjustmentFactor3 = data.adjustmentFactor3 ? Number(data.adjustmentFactor3) : 0;
      growthRate3 = baseGrowthRate + adjustmentFactor3;
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
