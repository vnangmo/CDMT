import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

interface CreateFinancingSourceData {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'MIXED';
}

interface UpdateFinancingSourceData {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  type?: 'INTERNAL' | 'EXTERNAL' | 'MIXED';
  isActive?: boolean;
}

export class FinancingSourceService {
  /**
   * Obtenir toutes les sources de financement
   */
  static async getAll(filters?: {
    isActive?: boolean;
    type?: 'INTERNAL' | 'EXTERNAL' | 'MIXED';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      type,
      search,
      page = 1,
      limit = 100,
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
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sources, total] = await Promise.all([
      prisma.financingSource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      prisma.financingSource.count({ where }),
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
    const source = await prisma.financingSource.findUnique({
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
    const source = await prisma.financingSource.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!source) {
      throw new NotFoundError('Source de financement non trouvée');
    }

    return source;
  }

  /**
   * Créer une source de financement
   */
  static async create(data: CreateFinancingSourceData) {
    // Vérifier que le code n'existe pas déjà
    const existingCode = await prisma.financingSource.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictError('Une source de financement avec ce code existe déjà');
    }

    const source = await prisma.financingSource.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
    });

    return source;
  }

  /**
   * Mettre à jour une source de financement
   */
  static async update(id: string, data: UpdateFinancingSourceData) {
    // Vérifier que la source existe
    const source = await prisma.financingSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundError('Source de financement non trouvée');
    }

    // Si changement de code, vérifier qu'il n'existe pas déjà
    if (data.code && data.code.toUpperCase() !== source.code) {
      const existingCode = await prisma.financingSource.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existingCode) {
        throw new ConflictError('Une source de financement avec ce code existe déjà');
      }
    }

    const updated = await prisma.financingSource.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
    });

    return updated;
  }

  /**
   * Supprimer une source de financement (soft delete)
   */
  static async delete(id: string) {
    // Vérifier que la source existe
    const source = await prisma.financingSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundError('Source de financement non trouvée');
    }

    // Soft delete
    const deleted = await prisma.financingSource.update({
      where: { id },
      data: { isActive: false },
    });

    return deleted;
  }

  /**
   * Restaurer une source de financement
   */
  static async restore(id: string) {
    const source = await prisma.financingSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundError('Source de financement non trouvée');
    }

    const restored = await prisma.financingSource.update({
      where: { id },
      data: { isActive: true },
    });

    return restored;
  }

  /**
   * Obtenir les statistiques des sources de financement
   */
  static async getStats() {
    const [total, active, internal, external, mixed] = await Promise.all([
      prisma.financingSource.count(),
      prisma.financingSource.count({ where: { isActive: true } }),
      prisma.financingSource.count({ where: { type: 'INTERNAL', isActive: true } }),
      prisma.financingSource.count({ where: { type: 'EXTERNAL', isActive: true } }),
      prisma.financingSource.count({ where: { type: 'MIXED', isActive: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byType: {
        internal,
        external,
        mixed,
      },
    };
  }
}
