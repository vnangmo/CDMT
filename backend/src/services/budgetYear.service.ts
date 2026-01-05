import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';

interface CreateBudgetYearData {
  year: number;
  label?: string;
  startDate: Date;
  endDate: Date;
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
}

interface UpdateBudgetYearData {
  label?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  isCurrent?: boolean;
}

export class BudgetYearService {
  /**
   * Obtenir toutes les années budgétaires
   */
  static async getAll(filters?: {
    status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
    isCurrent?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      isCurrent,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (isCurrent !== undefined) {
      where.isCurrent = isCurrent;
    }

    const [years, total] = await Promise.all([
      prisma.budgetYear.findMany({
        where,
        skip,
        take: limit,
        orderBy: { year: 'desc' },
      }),
      prisma.budgetYear.count({ where }),
    ]);

    return {
      data: years,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une année budgétaire par ID
   */
  static async getById(id: string) {
    const budgetYear = await prisma.budgetYear.findUnique({
      where: { id },
    });

    if (!budgetYear) {
      throw new NotFoundError('Année budgétaire non trouvée');
    }

    return budgetYear;
  }

  /**
   * Obtenir une année budgétaire par année
   */
  static async getByYear(year: number) {
    const budgetYear = await prisma.budgetYear.findUnique({
      where: { year },
    });

    if (!budgetYear) {
      throw new NotFoundError('Année budgétaire non trouvée');
    }

    return budgetYear;
  }

  /**
   * Obtenir l'année budgétaire courante
   */
  static async getCurrentYear() {
    const currentYear = await prisma.budgetYear.findFirst({
      where: { isCurrent: true },
    });

    if (!currentYear) {
      throw new NotFoundError('Aucune année budgétaire courante définie');
    }

    return currentYear;
  }

  /**
   * Créer une année budgétaire
   */
  static async create(data: CreateBudgetYearData) {
    // Vérifier que l'année n'existe pas déjà
    const existingYear = await prisma.budgetYear.findUnique({
      where: { year: data.year },
    });

    if (existingYear) {
      throw new ConflictError(`L'année budgétaire ${data.year} existe déjà`);
    }

    // Vérifier que startDate < endDate
    if (data.startDate >= data.endDate) {
      throw new BadRequestError('La date de début doit être antérieure à la date de fin');
    }

    const budgetYear = await prisma.budgetYear.create({
      data: {
        year: data.year,
        label: data.label || data.year.toString(),
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || 'DRAFT',
        isCurrent: false,
      },
    });

    return budgetYear;
  }

  /**
   * Mettre à jour une année budgétaire
   */
  static async update(id: string, data: UpdateBudgetYearData) {
    // Vérifier que l'année budgétaire existe
    const budgetYear = await prisma.budgetYear.findUnique({
      where: { id },
    });

    if (!budgetYear) {
      throw new NotFoundError('Année budgétaire non trouvée');
    }

    // Si on change startDate ou endDate, vérifier la cohérence
    const newStartDate = data.startDate || budgetYear.startDate;
    const newEndDate = data.endDate || budgetYear.endDate;

    if (newStartDate >= newEndDate) {
      throw new BadRequestError('La date de début doit être antérieure à la date de fin');
    }

    // Si on définit cette année comme courante, désactiver les autres
    if (data.isCurrent === true) {
      await prisma.budgetYear.updateMany({
        where: {
          id: { not: id },
          isCurrent: true,
        },
        data: { isCurrent: false },
      });
    }

    const updated = await prisma.budgetYear.update({
      where: { id },
      data: {
        label: data.label,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        isCurrent: data.isCurrent,
      },
    });

    return updated;
  }

  /**
   * Définir une année comme année courante
   */
  static async setAsCurrent(id: string) {
    // Vérifier que l'année budgétaire existe
    const budgetYear = await prisma.budgetYear.findUnique({
      where: { id },
    });

    if (!budgetYear) {
      throw new NotFoundError('Année budgétaire non trouvée');
    }

    // Une année courante doit être ACTIVE
    if (budgetYear.status !== 'ACTIVE') {
      throw new BadRequestError('Seule une année budgétaire ACTIVE peut être définie comme courante');
    }

    // Désactiver toutes les autres années courantes
    await prisma.budgetYear.updateMany({
      where: {
        id: { not: id },
        isCurrent: true,
      },
      data: { isCurrent: false },
    });

    // Activer cette année
    const updated = await prisma.budgetYear.update({
      where: { id },
      data: { isCurrent: true },
    });

    return updated;
  }

  /**
   * Changer le statut d'une année budgétaire
   */
  static async changeStatus(id: string, newStatus: 'DRAFT' | 'ACTIVE' | 'CLOSED') {
    // Vérifier que l'année budgétaire existe
    const budgetYear = await prisma.budgetYear.findUnique({
      where: { id },
    });

    if (!budgetYear) {
      throw new NotFoundError('Année budgétaire non trouvée');
    }

    // Vérifier les transitions autorisées
    const currentStatus = budgetYear.status;

    // DRAFT -> ACTIVE ou CLOSED
    // ACTIVE -> CLOSED
    // CLOSED ne peut pas changer (sauf réouverture manuelle)
    if (currentStatus === 'CLOSED' && newStatus !== 'CLOSED') {
      throw new BadRequestError('Une année CLOSED ne peut pas être réouverte automatiquement');
    }

    if (currentStatus === 'ACTIVE' && newStatus === 'DRAFT') {
      throw new BadRequestError('Une année ACTIVE ne peut pas revenir à DRAFT');
    }

    // Si on ferme l'année courante, retirer le flag isCurrent
    const updates: any = { status: newStatus };
    if (newStatus === 'CLOSED' && budgetYear.isCurrent) {
      updates.isCurrent = false;
    }

    const updated = await prisma.budgetYear.update({
      where: { id },
      data: updates,
    });

    return updated;
  }

  /**
   * Activer une année budgétaire (DRAFT -> ACTIVE)
   */
  static async activate(id: string) {
    return this.changeStatus(id, 'ACTIVE');
  }

  /**
   * Clôturer une année budgétaire (ACTIVE -> CLOSED)
   */
  static async close(id: string) {
    return this.changeStatus(id, 'CLOSED');
  }

  /**
   * Supprimer une année budgétaire
   */
  static async delete(id: string) {
    // Vérifier que l'année budgétaire existe
    const budgetYear = await prisma.budgetYear.findUnique({
      where: { id },
    });

    if (!budgetYear) {
      throw new NotFoundError('Année budgétaire non trouvée');
    }

    // Ne pas supprimer l'année courante
    if (budgetYear.isCurrent) {
      throw new BadRequestError('Impossible de supprimer l\'année budgétaire courante');
    }

    // Ne pas supprimer une année ACTIVE ou CLOSED
    if (budgetYear.status !== 'DRAFT') {
      throw new BadRequestError('Seules les années en statut DRAFT peuvent être supprimées');
    }

    await prisma.budgetYear.delete({
      where: { id },
    });

    return { message: 'Année budgétaire supprimée avec succès' };
  }

  /**
   * Obtenir les statistiques des années budgétaires
   */
  static async getStats() {
    const [total, draft, active, closed, current] = await Promise.all([
      prisma.budgetYear.count(),
      prisma.budgetYear.count({ where: { status: 'DRAFT' } }),
      prisma.budgetYear.count({ where: { status: 'ACTIVE' } }),
      prisma.budgetYear.count({ where: { status: 'CLOSED' } }),
      prisma.budgetYear.findFirst({ where: { isCurrent: true } }),
    ]);

    return {
      total,
      byStatus: {
        draft,
        active,
        closed,
      },
      currentYear: current ? current.year : null,
    };
  }
}
