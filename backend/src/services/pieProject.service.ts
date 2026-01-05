import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class PIEProjectService {
  /**
   * Créer un projet PIE (Plan d'Investissement Exceptionnel)
   */
  static async createPIEProject(data: {
    projectCode: string;
    name: string;
    description?: string;
    ministryId: string;
    programId?: string;
    actionId?: string;
    activityId?: string;
    totalAmount: number;
    amountY1?: number;
    amountY2?: number;
    amountY3?: number;
    category?: string;
    priority?: number;
    startYear?: number;
    endYear?: number;
    createdBy?: string;
  }) {
    // Vérifier l'unicité du code projet
    const existing = await prisma.pIEProject.findUnique({
      where: { projectCode: data.projectCode },
    });

    if (existing) {
      throw new BadRequestError(
        `Un projet PIE avec le code ${data.projectCode} existe déjà`
      );
    }

    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Valider que la somme des montants annuels ne dépasse pas le montant total
    const totalAnnual =
      (data.amountY1 || 0) + (data.amountY2 || 0) + (data.amountY3 || 0);

    if (totalAnnual > data.totalAmount) {
      throw new BadRequestError(
        'La somme des montants annuels dépasse le montant total du projet'
      );
    }

    return await prisma.pIEProject.create({
      data: {
        projectCode: data.projectCode,
        name: data.name,
        description: data.description,
        ministryId: data.ministryId,
        programId: data.programId,
        actionId: data.actionId,
        activityId: data.activityId,
        totalAmount: data.totalAmount,
        amountY1: data.amountY1 || 0,
        amountY2: data.amountY2 || 0,
        amountY3: data.amountY3 || 0,
        category: data.category,
        priority: data.priority,
        startYear: data.startYear,
        endYear: data.endYear,
        isExceptional: true,
        status: 'PLANNED',
        createdBy: data.createdBy,
      },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Obtenir tous les projets PIE avec filtres
   */
  static async getPIEProjects(filters: {
    ministryId?: string;
    programId?: string;
    actionId?: string;
    activityId?: string;
    category?: string;
    status?: string;
    fiscalYear?: number;
  }) {
    const where: any = {};

    if (filters.ministryId) where.ministryId = filters.ministryId;
    if (filters.programId) where.programId = filters.programId;
    if (filters.actionId) where.actionId = filters.actionId;
    if (filters.activityId) where.activityId = filters.activityId;
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;

    // Filtre par année fiscale (si le projet est actif pendant cette année)
    if (filters.fiscalYear) {
      where.OR = [
        { startYear: { lte: filters.fiscalYear } },
        { endYear: { gte: filters.fiscalYear } },
      ];
    }

    return await prisma.pIEProject.findMany({
      where,
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Obtenir un projet PIE par ID
   */
  static async getPIEProject(id: string) {
    const project = await prisma.pIEProject.findUnique({
      where: { id },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      throw new NotFoundError('Projet PIE non trouvé');
    }

    return project;
  }

  /**
   * Mettre à jour un projet PIE
   */
  static async updatePIEProject(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      totalAmount: number;
      amountY1: number;
      amountY2: number;
      amountY3: number;
      category: string;
      priority: number;
      status: string;
      startYear: number;
      endYear: number;
    }>
  ) {
    const project = await this.getPIEProject(id);

    // Valider que la somme des montants annuels ne dépasse pas le montant total
    if (data.totalAmount || data.amountY1 || data.amountY2 || data.amountY3) {
      const totalAmount = data.totalAmount || parseFloat(project.totalAmount.toString());
      const totalAnnual =
        (data.amountY1 !== undefined
          ? data.amountY1
          : parseFloat(project.amountY1.toString())) +
        (data.amountY2 !== undefined
          ? data.amountY2
          : parseFloat(project.amountY2.toString())) +
        (data.amountY3 !== undefined
          ? data.amountY3
          : parseFloat(project.amountY3.toString()));

      if (totalAnnual > totalAmount) {
        throw new BadRequestError(
          'La somme des montants annuels dépasse le montant total du projet'
        );
      }
    }

    return await prisma.pIEProject.update({
      where: { id },
      data,
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Supprimer un projet PIE
   */
  static async deletePIEProject(id: string) {
    await this.getPIEProject(id); // Vérifie l'existence

    return await prisma.pIEProject.delete({
      where: { id },
    });
  }

  /**
   * Obtenir un résumé par ministère
   */
  static async getSummaryByMinistry(fiscalYear?: number): Promise<any[]> {
    const where: any = {};

    if (fiscalYear) {
      where.OR = [
        { startYear: { lte: fiscalYear } },
        { endYear: { gte: fiscalYear } },
      ];
    }

    const summary = await prisma.pIEProject.groupBy({
      by: ['ministryId'],
      where,
      _sum: {
        totalAmount: true,
        amountY1: true,
        amountY2: true,
        amountY3: true,
      },
      _count: {
        id: true,
      },
    });

    // Enrichir avec les noms des ministères
    const enriched = await Promise.all(
      summary.map(async (s) => {
        const ministry = await prisma.ministry.findUnique({
          where: { id: s.ministryId },
          select: { name: true },
        });

        return {
          ministryId: s.ministryId,
          ministryName: ministry?.name,
          projectCount: s._count.id,
          totalAmount: s._sum.totalAmount,
          amountY1: s._sum.amountY1,
          amountY2: s._sum.amountY2,
          amountY3: s._sum.amountY3,
        };
      })
    );

    return enriched;
  }

  /**
   * Obtenir un résumé par catégorie
   */
  static async getSummaryByCategory(): Promise<any[]> {
    const summary = await prisma.pIEProject.groupBy({
      by: ['category'],
      _sum: {
        totalAmount: true,
        amountY1: true,
        amountY2: true,
        amountY3: true,
      },
      _count: {
        id: true,
      },
    });

    return summary.map((s) => ({
      category: s.category || 'NON_CATEGORISE',
      projectCount: s._count.id,
      totalAmount: s._sum.totalAmount,
      amountY1: s._sum.amountY1,
      amountY2: s._sum.amountY2,
      amountY3: s._sum.amountY3,
    }));
  }

  /**
   * Valider la cohérence des projets PIE
   */
  static async validateProjects(): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Vérifier les projets sans période définie
    const withoutDates = await prisma.pIEProject.count({
      where: {
        OR: [{ startYear: null }, { endYear: null }],
      },
    });

    if (withoutDates > 0) {
      warnings.push(
        `${withoutDates} projet(s) sans année de début ou de fin définie`
      );
    }

    // Vérifier les projets où la somme annuelle ne correspond pas au total
    const projects = await prisma.pIEProject.findMany();

    projects.forEach((p) => {
      const totalAnnual =
        parseFloat(p.amountY1.toString()) +
        parseFloat(p.amountY2.toString()) +
        parseFloat(p.amountY3.toString());
      const total = parseFloat(p.totalAmount.toString());

      if (Math.abs(totalAnnual - total) > 0.01) {
        warnings.push(
          `Projet ${p.projectCode}: somme annuelle (${totalAnnual}) != total (${total})`
        );
      }
    });

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }
}
