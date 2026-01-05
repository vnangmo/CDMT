import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateMacroFrameworkData {
  year: number;
  budgetYear: number;
  gdpGrowthRate: Decimal;
  inflationRate: Decimal;
  exchangeRate?: Decimal;
  agricultureGrowthRate?: Decimal;
  industryGrowthRate?: Decimal;
  servicesGrowthRate?: Decimal;
  // Prix des matières premières
  oilPrice?: Decimal;
  oilPriceYear1?: Decimal;
  oilPriceYear2?: Decimal;
  oilPriceYear3?: Decimal;
  goldPrice?: Decimal;
  goldPriceYear1?: Decimal;
  goldPriceYear2?: Decimal;
  goldPriceYear3?: Decimal;
  foodPriceIndex?: Decimal;
  foodPriceIndexYear1?: Decimal;
  foodPriceIndexYear2?: Decimal;
  foodPriceIndexYear3?: Decimal;
  // PIB nominal pour ratios
  nominalGDP?: Decimal;
  nominalGDPYear1?: Decimal;
  nominalGDPYear2?: Decimal;
  nominalGDPYear3?: Decimal;
  // Taux d'intérêt
  interestRate?: Decimal;
}

interface UpdateMacroFrameworkData {
  year?: number;
  budgetYear?: number;
  gdpGrowthRate?: Decimal;
  inflationRate?: Decimal;
  exchangeRate?: Decimal;
  agricultureGrowthRate?: Decimal;
  industryGrowthRate?: Decimal;
  servicesGrowthRate?: Decimal;
  // Prix des matières premières
  oilPrice?: Decimal;
  oilPriceYear1?: Decimal;
  oilPriceYear2?: Decimal;
  oilPriceYear3?: Decimal;
  goldPrice?: Decimal;
  goldPriceYear1?: Decimal;
  goldPriceYear2?: Decimal;
  goldPriceYear3?: Decimal;
  foodPriceIndex?: Decimal;
  foodPriceIndexYear1?: Decimal;
  foodPriceIndexYear2?: Decimal;
  foodPriceIndexYear3?: Decimal;
  // PIB nominal pour ratios
  nominalGDP?: Decimal;
  nominalGDPYear1?: Decimal;
  nominalGDPYear2?: Decimal;
  nominalGDPYear3?: Decimal;
  // Taux d'intérêt
  interestRate?: Decimal;
}

export class MacroFrameworkService {
  /**
   * Obtenir tous les cadres macroéconomiques
   */
  static async getAll(filters?: {
    year?: number;
    budgetYear?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      year,
      budgetYear,
      status,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (year !== undefined) {
      where.year = year;
    }

    if (budgetYear !== undefined) {
      where.budgetYear = budgetYear;
    }

    if (status) {
      where.status = status;
    }

    const [frameworks, total] = await Promise.all([
      prisma.macroFramework.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { budgetYear: 'desc' },
          { year: 'desc' },
        ],
        include: {
          revenueProjections: true,
          expenseProjections: true,
        },
      }),
      prisma.macroFramework.count({ where }),
    ]);

    return {
      data: frameworks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir un cadre macroéconomique par ID
   */
  static async getById(id: string) {
    const framework = await prisma.macroFramework.findUnique({
      where: { id },
      include: {
        revenueProjections: {
          orderBy: { categoryCode: 'asc' },
        },
        expenseProjections: {
          orderBy: { categoryCode: 'asc' },
          include: {
            ministry: true,
          },
        },
      },
    });

    if (!framework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    return framework;
  }

  /**
   * Obtenir un cadre macroéconomique par année
   */
  static async getByYear(year: number, budgetYear: number) {
    const framework = await prisma.macroFramework.findUnique({
      where: {
        year_budgetYear: {
          year,
          budgetYear,
        },
      },
      include: {
        revenueProjections: {
          orderBy: { categoryCode: 'asc' },
        },
        expenseProjections: {
          orderBy: { categoryCode: 'asc' },
          include: {
            ministry: true,
          },
        },
      },
    });

    if (!framework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé pour cette année');
    }

    return framework;
  }

  /**
   * Créer un cadre macroéconomique
   */
  static async create(data: CreateMacroFrameworkData, userId?: string) {
    // Vérifier si un cadre existe déjà pour cette année
    const existing = await prisma.macroFramework.findUnique({
      where: {
        year_budgetYear: {
          year: data.year,
          budgetYear: data.budgetYear,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Un cadre macroéconomique existe déjà pour cette année budgétaire');
    }

    return await prisma.macroFramework.create({
      data: {
        ...data,
        createdBy: userId,
        status: 'DRAFT',
      },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });
  }

  /**
   * Mettre à jour un cadre macroéconomique
   */
  static async update(id: string, data: UpdateMacroFrameworkData) {
    // Vérifier si le cadre existe
    const framework = await this.getById(id);

    // Vérifier si le statut permet la modification
    if (framework.status === 'APPROVED') {
      throw new BadRequestError('Impossible de modifier un cadre macroéconomique approuvé');
    }

    // Vérifier si la nouvelle combinaison year/budgetYear n'est pas déjà utilisée
    if (data.year !== undefined || data.budgetYear !== undefined) {
      const year = data.year ?? framework.year;
      const budgetYear = data.budgetYear ?? framework.budgetYear;

      const existing = await prisma.macroFramework.findFirst({
        where: {
          year,
          budgetYear,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Un cadre macroéconomique existe déjà pour cette année budgétaire');
      }
    }

    return await prisma.macroFramework.update({
      where: { id },
      data,
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });
  }

  /**
   * Supprimer un cadre macroéconomique
   */
  static async delete(id: string) {
    const framework = await this.getById(id);

    // Vérifier si le statut permet la suppression
    if (framework.status === 'APPROVED') {
      throw new BadRequestError('Impossible de supprimer un cadre macroéconomique approuvé');
    }

    // Suppression en cascade des projections
    return await prisma.macroFramework.delete({
      where: { id },
    });
  }

  /**
   * Valider un cadre macroéconomique (DRAFT → VALIDATED)
   */
  static async validate(id: string, userId: string) {
    const framework = await this.getById(id);

    if (framework.status !== 'DRAFT') {
      throw new BadRequestError('Seuls les cadres en statut DRAFT peuvent être validés');
    }

    return await prisma.macroFramework.update({
      where: { id },
      data: {
        status: 'VALIDATED',
        validatedBy: userId,
        validatedAt: new Date(),
      },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });
  }

  /**
   * Approuver un cadre macroéconomique (VALIDATED → APPROVED)
   */
  static async approve(id: string, userId: string) {
    const framework = await this.getById(id);

    if (framework.status !== 'VALIDATED') {
      throw new BadRequestError('Seuls les cadres validés peuvent être approuvés');
    }

    return await prisma.macroFramework.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });
  }

  /**
   * Rejeter un cadre macroéconomique (retour à DRAFT)
   */
  static async reject(id: string) {
    const framework = await this.getById(id);

    if (framework.status === 'APPROVED') {
      throw new BadRequestError('Impossible de rejeter un cadre approuvé');
    }

    return await prisma.macroFramework.update({
      where: { id },
      data: {
        status: 'DRAFT',
        validatedBy: null,
        validatedAt: null,
      },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });
  }

  /**
   * Obtenir les statistiques
   */
  static async getStats() {
    const [total, draft, validated, approved] = await Promise.all([
      prisma.macroFramework.count(),
      prisma.macroFramework.count({ where: { status: 'DRAFT' } }),
      prisma.macroFramework.count({ where: { status: 'VALIDATED' } }),
      prisma.macroFramework.count({ where: { status: 'APPROVED' } }),
    ]);

    return {
      total,
      draft,
      validated,
      approved,
    };
  }
}
