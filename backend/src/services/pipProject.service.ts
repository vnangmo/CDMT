import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class PIPProjectService {
  /**
   * Créer un projet PIP (Programme d'Investissement Public)
   */
  static async createPIPProject(data: {
    projectCode: string;
    name: string;
    description?: string;
    ministryId: string;
    programId?: string;
    actionId?: string;
    activityId?: string;
    fundingSourceId?: string;
    externalDonor?: string;
    totalAmount: number;
    amountY1?: number;
    amountY2?: number;
    amountY3?: number;
    category?: string;
    projectType?: string;
    priority?: number;
    isRecurrent?: boolean;
    startYear?: number;
    endYear?: number;
    createdBy?: string;
  }) {
    // Vérifier l'unicité du code projet
    const existing = await prisma.pIPProject.findUnique({
      where: { projectCode: data.projectCode },
    });

    if (existing) {
      throw new BadRequestError(
        `Un projet PIP avec le code ${data.projectCode} existe déjà`
      );
    }

    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Vérifier que la source de financement existe si fournie
    if (data.fundingSourceId) {
      const fundingSource = await prisma.fundingSource.findUnique({
        where: { id: data.fundingSourceId },
      });

      if (!fundingSource) {
        throw new NotFoundError('Source de financement non trouvée');
      }
    }

    // Valider que la somme des montants annuels ne dépasse pas le montant total
    const totalAnnual =
      (data.amountY1 || 0) + (data.amountY2 || 0) + (data.amountY3 || 0);

    if (totalAnnual > data.totalAmount) {
      throw new BadRequestError(
        'La somme des montants annuels dépasse le montant total du projet'
      );
    }

    return await prisma.pIPProject.create({
      data: {
        projectCode: data.projectCode,
        name: data.name,
        description: data.description,
        ministryId: data.ministryId,
        programId: data.programId,
        actionId: data.actionId,
        activityId: data.activityId,
        fundingSourceId: data.fundingSourceId,
        externalDonor: data.externalDonor,
        totalAmount: data.totalAmount,
        amountY1: data.amountY1 || 0,
        amountY2: data.amountY2 || 0,
        amountY3: data.amountY3 || 0,
        projectType: data.projectType,
        priority: data.priority,
        isRecurrent: data.isRecurrent || false,
        status: 'PLANNED',
        startYear: data.startYear,
        endYear: data.endYear,
        createdBy: data.createdBy,
      },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
        fundingSource: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Obtenir tous les projets PIP avec filtres
   */
  static async getPIPProjects(filters: {
    ministryId?: string;
    programId?: string;
    actionId?: string;
    activityId?: string;
    fundingSourceId?: string;
    category?: string;
    projectType?: string;
    status?: string;
    isRecurrent?: boolean;
    fiscalYear?: number;
  }) {
    const where: any = {};

    if (filters.ministryId) where.ministryId = filters.ministryId;
    if (filters.programId) where.programId = filters.programId;
    if (filters.actionId) where.actionId = filters.actionId;
    if (filters.activityId) where.activityId = filters.activityId;
    if (filters.fundingSourceId) where.fundingSourceId = filters.fundingSourceId;
    if (filters.category) where.category = filters.category;
    if (filters.projectType) where.projectType = filters.projectType;
    if (filters.status) where.status = filters.status;
    if (filters.isRecurrent !== undefined) where.isRecurrent = filters.isRecurrent;

    // Filtre par année fiscale (si le projet est actif pendant cette année)
    if (filters.fiscalYear) {
      where.OR = [
        { startYear: { lte: filters.fiscalYear } },
        { endYear: { gte: filters.fiscalYear } },
      ];
    }

    return await prisma.pIPProject.findMany({
      where,
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
        fundingSource: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Obtenir un projet PIP par ID
   */
  static async getPIPProject(id: string) {
    const project = await prisma.pIPProject.findUnique({
      where: { id },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
        fundingSource: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      throw new NotFoundError('Projet PIP non trouvé');
    }

    return project;
  }

  /**
   * Mettre à jour un projet PIP
   */
  static async updatePIPProject(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      fundingSourceId: string;
      externalDonor: string;
      totalAmount: number;
      amountY1: number;
      amountY2: number;
      amountY3: number;
      category: string;
      projectType: string;
      priority: number;
      isRecurrent: boolean;
      status: string;
      startYear: number;
      endYear: number;
    }>
  ) {
    const project = await this.getPIPProject(id);

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

    return await prisma.pIPProject.update({
      where: { id },
      data,
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, name: true } },
        activity: { select: { id: true, name: true } },
        fundingSource: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Supprimer un projet PIP
   */
  static async deletePIPProject(id: string) {
    await this.getPIPProject(id); // Vérifie l'existence

    return await prisma.pIPProject.delete({
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

    const summary = await prisma.pIPProject.groupBy({
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
   * Obtenir un résumé par source de financement
   */
  static async getSummaryByFundingSource(): Promise<any[]> {
    const summary = await prisma.pIPProject.groupBy({
      by: ['fundingSourceId'],
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

    // Enrichir avec les noms des sources
    const enriched = await Promise.all(
      summary.map(async (s) => {
        if (!s.fundingSourceId) {
          return {
            fundingSourceId: null,
            fundingSourceName: 'NON_SPECIFIE',
            projectCount: s._count.id,
            totalAmount: s._sum.totalAmount,
            amountY1: s._sum.amountY1,
            amountY2: s._sum.amountY2,
            amountY3: s._sum.amountY3,
          };
        }

        const fundingSource = await prisma.fundingSource.findUnique({
          where: { id: s.fundingSourceId },
          select: { name: true },
        });

        return {
          fundingSourceId: s.fundingSourceId,
          fundingSourceName: fundingSource?.name,
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
   * Obtenir les projets récurrents
   */
  static async getRecurrentProjects() {
    return await this.getPIPProjects({ isRecurrent: true });
  }

  /**
   * Obtenir les projets avec donateurs externes
   */
  static async getExternallyFundedProjects() {
    return await prisma.pIPProject.findMany({
      where: {
        externalDonor: { not: null },
      },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        fundingSource: { select: { id: true, name: true } },
      },
      orderBy: { totalAmount: 'desc' },
    });
  }

  /**
   * Valider la cohérence des projets PIP
   */
  static async validateProjects(): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Vérifier les projets sans période définie
    const withoutDates = await prisma.pIPProject.count({
      where: {
        OR: [{ startYear: null }, { endYear: null }],
      },
    });

    if (withoutDates > 0) {
      warnings.push(
        `${withoutDates} projet(s) sans année de début ou de fin définie`
      );
    }

    // Vérifier les projets sans source de financement
    const withoutFunding = await prisma.pIPProject.count({
      where: {
        AND: [{ fundingSourceId: null }, { externalDonor: null }],
      },
    });

    if (withoutFunding > 0) {
      warnings.push(
        `${withoutFunding} projet(s) sans source de financement définie`
      );
    }

    // Vérifier les projets où la somme annuelle ne correspond pas au total
    const projects = await prisma.pIPProject.findMany();

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
