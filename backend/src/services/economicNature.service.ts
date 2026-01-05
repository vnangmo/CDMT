import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

interface CreateEconomicNatureData {
  code: string;
  name: string;
  type: string; // REVENUE, EXPENSE
  description?: string;
}

interface UpdateEconomicNatureData {
  code?: string;
  name?: string;
  type?: string;
  description?: string;
  isActive?: boolean;
}

export class EconomicNatureService {
  /**
   * Obtenir toutes les natures économiques
   */
  static async getAll(filters?: {
    isActive?: boolean;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      type,
      search,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [natures, total] = await Promise.all([
      prisma.economicNature.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      }),
      prisma.economicNature.count({ where }),
    ]);

    return {
      data: natures,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une nature économique par ID
   */
  static async getById(id: string) {
    const nature = await prisma.economicNature.findUnique({
      where: { id },
    });

    if (!nature) {
      throw new NotFoundError('Nature économique non trouvée');
    }

    return nature;
  }

  /**
   * Obtenir une nature économique par code
   */
  static async getByCode(code: string) {
    const nature = await prisma.economicNature.findUnique({
      where: { code },
    });

    if (!nature) {
      throw new NotFoundError('Nature économique non trouvée');
    }

    return nature;
  }

  /**
   * Créer une nature économique
   */
  static async create(data: CreateEconomicNatureData) {
    // Vérifier si le code existe déjà
    const existing = await prisma.economicNature.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError('Une nature économique avec ce code existe déjà');
    }

    return await prisma.economicNature.create({
      data,
    });
  }

  /**
   * Mettre à jour une nature économique
   */
  static async update(id: string, data: UpdateEconomicNatureData) {
    // Vérifier si la nature existe
    await this.getById(id);

    // Vérifier si le nouveau code n'est pas déjà utilisé
    if (data.code) {
      const existing = await prisma.economicNature.findFirst({
        where: {
          code: data.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Une nature économique avec ce code existe déjà');
      }
    }

    return await prisma.economicNature.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer une nature économique (soft delete)
   */
  static async delete(id: string) {
    await this.getById(id);

    return await prisma.economicNature.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Restaurer une nature économique
   */
  static async restore(id: string) {
    await this.getById(id);

    return await prisma.economicNature.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Obtenir les statistiques
   */
  static async getStats() {
    const [total, active, inactive, revenue, expense] = await Promise.all([
      prisma.economicNature.count(),
      prisma.economicNature.count({ where: { isActive: true } }),
      prisma.economicNature.count({ where: { isActive: false } }),
      prisma.economicNature.count({ where: { type: 'REVENUE' } }),
      prisma.economicNature.count({ where: { type: 'EXPENSE' } }),
    ]);

    return {
      total,
      active,
      inactive,
      revenue,
      expense,
    };
  }
}
