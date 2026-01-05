import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import CacheService from './cache.service';

interface CreateFiscalYearData {
  year: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
}

interface UpdateFiscalYearData {
  year?: number;
  name?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isClosed?: boolean;
  isActive?: boolean;
}

export class FiscalYearService {
  /**
   * Generate cache key for fiscal year list
   */
  private static getCacheKey(filters?: {
    isActive?: boolean;
    isClosed?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): string {
    if (!filters || Object.keys(filters).length === 0) {
      return 'fiscalYears:all';
    }

    const {
      isActive,
      isClosed,
      search,
      page = 1,
      limit = 50,
    } = filters;

    // Don't cache search queries (too dynamic)
    if (search) {
      return '';
    }

    const parts = ['fiscalYears'];
    if (isActive !== undefined) parts.push(`active:${isActive}`);
    if (isClosed !== undefined) parts.push(`closed:${isClosed}`);
    parts.push(`page:${page}`, `limit:${limit}`);

    return parts.join(':');
  }

  /**
   * Obtenir toutes les années fiscales (avec cache pour requêtes communes)
   */
  static async getAll(filters?: {
    isActive?: boolean;
    isClosed?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      isClosed,
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

    if (isClosed !== undefined) {
      where.isClosed = isClosed;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { year: isNaN(parseInt(search)) ? undefined : parseInt(search) },
      ].filter(condition => condition.year !== undefined || condition.name);
    }

    const [years, total] = await Promise.all([
      prisma.fiscalYear.findMany({
        where,
        skip,
        take: limit,
        orderBy: { year: 'desc' },
      }),
      prisma.fiscalYear.count({ where }),
    ]);

    const result = {
      data: years,
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
   * Obtenir une année fiscale par ID
   */
  static async getById(id: string) {
    const year = await prisma.fiscalYear.findUnique({
      where: { id },
    });

    if (!year) {
      throw new NotFoundError('Année fiscale non trouvée');
    }

    return year;
  }

  /**
   * Obtenir une année fiscale par année
   */
  static async getByYear(year: number) {
    const fiscalYear = await prisma.fiscalYear.findUnique({
      where: { year },
    });

    if (!fiscalYear) {
      throw new NotFoundError('Année fiscale non trouvée');
    }

    return fiscalYear;
  }

  /**
   * Créer une année fiscale
   */
  static async create(data: CreateFiscalYearData) {
    // Vérifier si l'année existe déjà
    const existing = await prisma.fiscalYear.findUnique({
      where: { year: data.year },
    });

    if (existing) {
      throw new ConflictError('Une année fiscale pour cette année existe déjà');
    }

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });

    // Invalidate all fiscal year caches
    await CacheService.delPattern('fiscalYears:*');

    return fiscalYear;
  }

  /**
   * Mettre à jour une année fiscale
   */
  static async update(id: string, data: UpdateFiscalYearData) {
    // Vérifier si l'année existe
    await this.getById(id);

    // Vérifier si la nouvelle année n'est pas déjà utilisée
    if (data.year) {
      const existing = await prisma.fiscalYear.findFirst({
        where: {
          year: data.year,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError('Une année fiscale pour cette année existe déjà');
      }
    }

    const updateData: any = { ...data };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    const updated = await prisma.fiscalYear.update({
      where: { id },
      data: updateData,
    });

    // Invalidate all fiscal year caches
    await CacheService.delPattern('fiscalYears:*');

    return updated;
  }

  /**
   * Supprimer une année fiscale (soft delete)
   */
  static async delete(id: string) {
    await this.getById(id);

    const deleted = await prisma.fiscalYear.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate all fiscal year caches
    await CacheService.delPattern('fiscalYears:*');

    return deleted;
  }

  /**
   * Restaurer une année fiscale
   */
  static async restore(id: string) {
    await this.getById(id);

    const restored = await prisma.fiscalYear.update({
      where: { id },
      data: { isActive: true },
    });

    // Invalidate all fiscal year caches
    await CacheService.delPattern('fiscalYears:*');

    return restored;
  }

  /**
   * Clôturer une année fiscale
   */
  static async close(id: string) {
    await this.getById(id);

    const closed = await prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: true },
    });

    // Invalidate all fiscal year caches
    await CacheService.delPattern('fiscalYears:*');

    return closed;
  }

  /**
   * Rouvrir une année fiscale
   */
  static async reopen(id: string) {
    await this.getById(id);

    const reopened = await prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: false },
    });

    // Invalidate all fiscal year caches
    await CacheService.delPattern('fiscalYears:*');

    return reopened;
  }

  /**
   * Obtenir les statistiques
   */
  static async getStats() {
    const [total, active, inactive, closed, open] = await Promise.all([
      prisma.fiscalYear.count(),
      prisma.fiscalYear.count({ where: { isActive: true } }),
      prisma.fiscalYear.count({ where: { isActive: false } }),
      prisma.fiscalYear.count({ where: { isClosed: true } }),
      prisma.fiscalYear.count({ where: { isClosed: false } }),
    ]);

    return {
      total,
      active,
      inactive,
      closed,
      open,
    };
  }
}
