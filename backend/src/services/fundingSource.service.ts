import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

interface CreateFundingSourceData {
  code: string;
  name: string;
  type: string; // INTERNAL, EXTERNAL, LOAN, GRANT
  description?: string;
}

interface UpdateFundingSourceData {
  code?: string;
  name?: string;
  type?: string;
  description?: string;
  isActive?: boolean;
}

export class FundingSourceService {
  /**
   * Obtenir toutes les sources de financement
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

    const [sources, total] = await Promise.all([
      prisma.fundingSource.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      }),
      prisma.fundingSource.count({ where }),
    ]);

    return {
      data: sources,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une source de financement par ID
   */
  static async getById(id: string) {
    const source = await prisma.fundingSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundError('Source de financement non trouvée');
    }

    return source;
  }

  /**
   * Obtenir une source de financement par code
   */
  static async getByCode(code: string) {
    const source = await prisma.fundingSource.findUnique({
      where: { code },
    });

    if (!source) {
      throw new NotFoundError('Source de financement non trouvée');
    }

    return source;
  }

  /**
   * Créer une source de financement
   */
  static async create(data: CreateFundingSourceData) {
    // Vérifier si le code existe déjà
    const existing = await prisma.fundingSource.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError('Une source de financement avec ce code existe déjà');
    }

    return await prisma.fundingSource.create({
      data,
    });
  }

  /**
   * Mettre à jour une source de financement
   */
  static async update(id: string, data: UpdateFundingSourceData) {
    // Vérifier si la source existe
    await this.getById(id);

    // Vérifier si le nouveau code n'est pas déjà utilisé
    if (data.code) {
      const existing = await prisma.fundingSource.findFirst({
        where: {
          code: data.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Une source de financement avec ce code existe déjà');
      }
    }

    return await prisma.fundingSource.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer une source de financement (soft delete)
   */
  static async delete(id: string) {
    await this.getById(id);

    return await prisma.fundingSource.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Restaurer une source de financement
   */
  static async restore(id: string) {
    await this.getById(id);

    return await prisma.fundingSource.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Obtenir les statistiques
   */
  static async getStats() {
    const [total, active, inactive, internal, external, loan, grant] = await Promise.all([
      prisma.fundingSource.count(),
      prisma.fundingSource.count({ where: { isActive: true } }),
      prisma.fundingSource.count({ where: { isActive: false } }),
      prisma.fundingSource.count({ where: { type: 'INTERNAL' } }),
      prisma.fundingSource.count({ where: { type: 'EXTERNAL' } }),
      prisma.fundingSource.count({ where: { type: 'LOAN' } }),
      prisma.fundingSource.count({ where: { type: 'GRANT' } }),
    ]);

    return {
      total,
      active,
      inactive,
      internal,
      external,
      loan,
      grant,
    };
  }
}
