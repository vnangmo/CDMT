import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';

interface CreateFunctionalClassificationData {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
}

interface UpdateFunctionalClassificationData {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export class FunctionalClassificationService {
  /**
   * Obtenir toutes les classifications fonctionnelles
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

    const [classifications, total] = await Promise.all([
      prisma.functionalClassification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          parent: true,
          children: true,
        },
      }),
      prisma.functionalClassification.count({ where }),
    ]);

    return {
      data: classifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une classification fonctionnelle par ID
   */
  static async getById(id: string) {
    const classification = await prisma.functionalClassification.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
        },
      },
    });

    if (!classification) {
      throw new NotFoundError('Classification fonctionnelle non trouvée');
    }

    return classification;
  }

  /**
   * Obtenir une classification fonctionnelle par code
   */
  static async getByCode(code: string) {
    const classification = await prisma.functionalClassification.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!classification) {
      throw new NotFoundError('Classification fonctionnelle non trouvée');
    }

    return classification;
  }

  /**
   * Obtenir l'arborescence des classifications fonctionnelles
   */
  static async getTree() {
    const rootClassifications = await prisma.functionalClassification.findMany({
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

    return rootClassifications;
  }

  /**
   * Créer une classification fonctionnelle
   */
  static async create(data: CreateFunctionalClassificationData) {
    // Vérifier que le code n'existe pas déjà
    const existingCode = await prisma.functionalClassification.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictError('Une classification avec ce code existe déjà');
    }

    // Si parentId est fourni, vérifier qu'il existe et calculer le level
    let level = 1;
    if (data.parentId) {
      const parent = await prisma.functionalClassification.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new BadRequestError('Classification parente non trouvée');
      }

      level = parent.level + 1;
    }

    const classification = await prisma.functionalClassification.create({
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

    return classification;
  }

  /**
   * Mettre à jour une classification fonctionnelle
   */
  static async update(id: string, data: UpdateFunctionalClassificationData) {
    // Vérifier que la classification existe
    const classification = await prisma.functionalClassification.findUnique({
      where: { id },
    });

    if (!classification) {
      throw new NotFoundError('Classification fonctionnelle non trouvée');
    }

    // Si changement de code, vérifier qu'il n'existe pas déjà
    if (data.code && data.code.toUpperCase() !== classification.code) {
      const existingCode = await prisma.functionalClassification.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existingCode) {
        throw new ConflictError('Une classification avec ce code existe déjà');
      }
    }

    // Si changement de parent, vérifier qu'il existe et éviter les cycles
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestError('Une classification ne peut pas être son propre parent');
      }

      if (data.parentId) {
        const parent = await prisma.functionalClassification.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          throw new BadRequestError('Classification parente non trouvée');
        }

        // Vérifier que le parent n'est pas un enfant de la classification actuelle
        const isDescendant = await this.isDescendant(id, data.parentId);
        if (isDescendant) {
          throw new BadRequestError('Impossible de créer une référence circulaire');
        }
      }
    }

    const updated = await prisma.functionalClassification.update({
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
   * Supprimer une classification fonctionnelle (soft delete)
   */
  static async delete(id: string) {
    // Vérifier que la classification existe
    const classification = await prisma.functionalClassification.findUnique({
      where: { id },
      include: {
        children: { where: { isActive: true } },
      },
    });

    if (!classification) {
      throw new NotFoundError('Classification fonctionnelle non trouvée');
    }

    // Vérifier qu'il n'y a pas de classifications enfants actives
    if (classification.children.length > 0) {
      throw new BadRequestError(
        `Impossible de supprimer cette classification car ${classification.children.length} sous-classification(s) y sont associées`
      );
    }

    // Soft delete
    const deleted = await prisma.functionalClassification.update({
      where: { id },
      data: { isActive: false },
    });

    return deleted;
  }

  /**
   * Restaurer une classification fonctionnelle
   */
  static async restore(id: string) {
    const classification = await prisma.functionalClassification.findUnique({
      where: { id },
    });

    if (!classification) {
      throw new NotFoundError('Classification fonctionnelle non trouvée');
    }

    const restored = await prisma.functionalClassification.update({
      where: { id },
      data: { isActive: true },
    });

    return restored;
  }

  /**
   * Vérifier si un ID est un descendant d'un autre
   */
  private static async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    const descendant = await prisma.functionalClassification.findUnique({
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
   * Obtenir les statistiques des classifications fonctionnelles
   */
  static async getStats() {
    const [total, active, rootClassifications] = await Promise.all([
      prisma.functionalClassification.count(),
      prisma.functionalClassification.count({ where: { isActive: true } }),
      prisma.functionalClassification.count({
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
      rootClassifications,
      childClassifications: active - rootClassifications,
    };
  }
}
