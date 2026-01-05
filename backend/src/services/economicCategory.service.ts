import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';

interface CreateEconomicCategoryData {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
}

interface UpdateEconomicCategoryData {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export class EconomicCategoryService {
  /**
   * Obtenir toutes les catégories économiques
   */
  static async getAll(filters?: {
    isActive?: boolean;
    search?: string;
    parentId?: string | null;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      search,
      parentId,
      page = 1,
      limit = 100,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.economicCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          parent: true,
          children: true,
        },
      }),
      prisma.economicCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une catégorie économique par ID
   */
  static async getById(id: string) {
    const category = await prisma.economicCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Catégorie économique non trouvée');
    }

    return category;
  }

  /**
   * Obtenir une catégorie économique par code
   */
  static async getByCode(code: string) {
    const category = await prisma.economicCategory.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Catégorie économique non trouvée');
    }

    return category;
  }

  /**
   * Obtenir l'arborescence des catégories économiques
   */
  static async getTree() {
    const rootCategories = await prisma.economicCategory.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      orderBy: { code: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { code: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { code: 'asc' },
            },
          },
        },
      },
    });

    return rootCategories;
  }

  /**
   * Créer une catégorie économique
   */
  static async create(data: CreateEconomicCategoryData) {
    // Vérifier que le code n'existe pas déjà
    const existingCode = await prisma.economicCategory.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictError('Une catégorie avec ce code existe déjà');
    }

    // Si parentId est fourni, vérifier qu'il existe et calculer le level
    let level = 1;
    if (data.parentId) {
      const parent = await prisma.economicCategory.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new BadRequestError('Catégorie parente non trouvée');
      }

      level = parent.level + 1;
    }

    const category = await prisma.economicCategory.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        level,
        parentId: data.parentId || null,
      },
      include: {
        parent: true,
      },
    });

    return category;
  }

  /**
   * Mettre à jour une catégorie économique
   */
  static async update(id: string, data: UpdateEconomicCategoryData) {
    // Vérifier que la catégorie existe
    const category = await prisma.economicCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Catégorie économique non trouvée');
    }

    // Si changement de code, vérifier qu'il n'existe pas déjà
    if (data.code && data.code.toUpperCase() !== category.code) {
      const existingCode = await prisma.economicCategory.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existingCode) {
        throw new ConflictError('Une catégorie avec ce code existe déjà');
      }
    }

    // Si changement de parent, vérifier qu'il existe et éviter les cycles
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestError('Une catégorie ne peut pas être son propre parent');
      }

      if (data.parentId) {
        const parent = await prisma.economicCategory.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          throw new BadRequestError('Catégorie parente non trouvée');
        }

        // Vérifier que le parent n'est pas un enfant de la catégorie actuelle
        const isDescendant = await this.isDescendant(id, data.parentId);
        if (isDescendant) {
          throw new BadRequestError('Impossible de créer une référence circulaire');
        }
      }
    }

    const updated = await prisma.economicCategory.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return updated;
  }

  /**
   * Supprimer une catégorie économique (soft delete)
   */
  static async delete(id: string) {
    // Vérifier que la catégorie existe
    const category = await prisma.economicCategory.findUnique({
      where: { id },
      include: {
        children: { where: { isActive: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Catégorie économique non trouvée');
    }

    // Vérifier qu'il n'y a pas de catégories enfants actives
    if (category.children.length > 0) {
      throw new BadRequestError(
        `Impossible de supprimer cette catégorie car ${category.children.length} sous-catégorie(s) y sont associées`
      );
    }

    // Soft delete
    const deleted = await prisma.economicCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return deleted;
  }

  /**
   * Restaurer une catégorie économique
   */
  static async restore(id: string) {
    const category = await prisma.economicCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Catégorie économique non trouvée');
    }

    const restored = await prisma.economicCategory.update({
      where: { id },
      data: { isActive: true },
    });

    return restored;
  }

  /**
   * Vérifier si un ID est un descendant d'un autre
   */
  private static async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    const descendant = await prisma.economicCategory.findUnique({
      where: { id: descendantId },
      include: { parent: true },
    });

    if (!descendant) {
      return false;
    }

    if (!descendant.parentId) {
      return false;
    }

    if (descendant.parentId === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parentId);
  }

  /**
   * Obtenir les statistiques des catégories économiques
   */
  static async getStats() {
    const [total, active, rootCategories] = await Promise.all([
      prisma.economicCategory.count(),
      prisma.economicCategory.count({ where: { isActive: true } }),
      prisma.economicCategory.count({
        where: {
          parentId: null,
          isActive: true,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      rootCategories,
      childCategories: active - rootCategories,
    };
  }
}
