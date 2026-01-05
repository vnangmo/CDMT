import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import CacheService from './cache.service';

interface CreateMinistryData {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  isPriority?: boolean;
}

interface UpdateMinistryData {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  isPriority?: boolean;
  isActive?: boolean;
}

export class MinistryService {
  /**
   * Generate cache key for ministry list
   */
  private static getCacheKey(filters?: {
    isActive?: boolean;
    isPriority?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): string {
    if (!filters || Object.keys(filters).length === 0) {
      return 'ministries:all';
    }

    const {
      isActive,
      isPriority,
      search,
      page = 1,
      limit = 50,
    } = filters;

    // Only cache when there's no search query (search results are too dynamic)
    if (search) {
      return ''; // No caching for search queries
    }

    const parts = ['ministries'];
    if (isActive !== undefined) parts.push(`active:${isActive}`);
    if (isPriority !== undefined) parts.push(`priority:${isPriority}`);
    parts.push(`page:${page}`, `limit:${limit}`);

    return parts.join(':');
  }

  /**
   * Obtenir tous les ministères (avec cache pour requêtes communes)
   */
  static async getAll(filters?: {
    isActive?: boolean;
    isPriority?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      isPriority,
      search,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = this.getCacheKey(filters);

    // Try cache first (only if cacheKey is not empty)
    if (cacheKey) {
      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPriority !== undefined) {
      where.isPriority = isPriority;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [ministries, total] = await Promise.all([
      prisma.ministry.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPriority: 'desc' }, { name: 'asc' }],
      }),
      prisma.ministry.count({ where }),
    ]);

    const result = {
      data: ministries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result (1 hour TTL) if we have a cache key
    if (cacheKey) {
      await CacheService.set(cacheKey, result, 3600);
    }

    return result;
  }

  /**
   * Obtenir un ministère par ID
   */
  static async getById(id: string) {
    const ministry = await prisma.ministry.findUnique({
      where: { id },
      include: {
        programs: {
          include: {
            actions: {
              include: {
                activities: true,
              },
            },
          },
        },
      },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    return ministry;
  }

  /**
   * Obtenir un ministère par code
   */
  static async getByCode(code: string) {
    const ministry = await prisma.ministry.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    return ministry;
  }

  /**
   * Créer un ministère
   */
  static async create(data: CreateMinistryData) {
    // Vérifier que le code n'existe pas déjà
    const existingCode = await prisma.ministry.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictError('Un ministère avec ce code existe déjà');
    }

    const ministry = await prisma.ministry.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
    });

    // Invalidate all ministry caches
    await CacheService.delPattern('ministries:*');

    return ministry;
  }

  /**
   * Mettre à jour un ministère
   */
  static async update(id: string, data: UpdateMinistryData) {
    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Si changement de code, vérifier qu'il n'existe pas déjà
    if (data.code && data.code.toUpperCase() !== ministry.code) {
      const existingCode = await prisma.ministry.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existingCode) {
        throw new ConflictError('Un ministère avec ce code existe déjà');
      }
    }

    const updated = await prisma.ministry.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
    });

    // Invalidate all ministry caches
    await CacheService.delPattern('ministries:*');

    return updated;
  }

  /**
   * Supprimer un ministère (soft delete)
   */
  static async delete(id: string) {
    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Vérifier qu'il n'y a pas d'utilisateurs associés
    const usersCount = await prisma.user.count({
      where: { ministryId: id },
    });

    if (usersCount > 0) {
      throw new BadRequestError(
        `Impossible de supprimer ce ministère car ${usersCount} utilisateur(s) y sont associés`
      );
    }

    // Soft delete
    const deleted = await prisma.ministry.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate all ministry caches
    await CacheService.delPattern('ministries:*');

    return deleted;
  }

  /**
   * Restaurer un ministère
   */
  static async restore(id: string) {
    const ministry = await prisma.ministry.findUnique({
      where: { id },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    const restored = await prisma.ministry.update({
      where: { id },
      data: { isActive: true },
    });

    // Invalidate all ministry caches
    await CacheService.delPattern('ministries:*');

    return restored;
  }

  /**
   * Obtenir les statistiques des ministères
   */
  static async getStats() {
    const [total, active, priority, withPrograms] = await Promise.all([
      prisma.ministry.count(),
      prisma.ministry.count({ where: { isActive: true } }),
      prisma.ministry.count({ where: { isPriority: true } }),
      prisma.ministry.count({
        where: {
          programs: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      priority,
      withPrograms,
      withoutPrograms: total - withPrograms,
    };
  }
}
