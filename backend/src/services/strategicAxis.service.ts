import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

interface CreateStrategicAxisData {
  code: string;
  name: string;
  description?: string;
}

interface UpdateStrategicAxisData {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export class StrategicAxisService {
  /**
   * Obtenir tous les axes stratégiques
   */
  static async getAll(filters?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      search,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [axes, total] = await Promise.all([
      prisma.strategicAxis.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.strategicAxis.count({ where }),
    ]);

    return {
      data: axes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir un axe stratégique par ID
   */
  static async getById(id: string) {
    const axis = await prisma.strategicAxis.findUnique({
      where: { id },
    });

    if (!axis) {
      throw new NotFoundError('Axe stratégique non trouvé');
    }

    return axis;
  }

  /**
   * Obtenir un axe stratégique par code
   */
  static async getByCode(code: string) {
    const axis = await prisma.strategicAxis.findUnique({
      where: { code },
    });

    if (!axis) {
      throw new NotFoundError('Axe stratégique non trouvé');
    }

    return axis;
  }

  /**
   * Créer un axe stratégique
   */
  static async create(data: CreateStrategicAxisData) {
    // Vérifier si le code existe déjà
    const existing = await prisma.strategicAxis.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError('Un axe stratégique avec ce code existe déjà');
    }

    return await prisma.strategicAxis.create({
      data,
    });
  }

  /**
   * Mettre à jour un axe stratégique
   */
  static async update(id: string, data: UpdateStrategicAxisData) {
    // Vérifier si l'axe existe
    await this.getById(id);

    // Vérifier si le nouveau code n'est pas déjà utilisé
    if (data.code) {
      const existing = await prisma.strategicAxis.findFirst({
        where: {
          code: data.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Un axe stratégique avec ce code existe déjà');
      }
    }

    return await prisma.strategicAxis.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un axe stratégique (soft delete)
   */
  static async delete(id: string) {
    await this.getById(id);

    return await prisma.strategicAxis.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Restaurer un axe stratégique
   */
  static async restore(id: string) {
    await this.getById(id);

    return await prisma.strategicAxis.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Obtenir les statistiques
   */
  static async getStats() {
    const [total, active, inactive] = await Promise.all([
      prisma.strategicAxis.count(),
      prisma.strategicAxis.count({ where: { isActive: true } }),
      prisma.strategicAxis.count({ where: { isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}
