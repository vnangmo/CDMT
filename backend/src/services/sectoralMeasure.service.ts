import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { WorkflowService, WorkflowStatus } from './workflow.service';

const prisma = new PrismaClient();

export class SectoralMeasureService {
  /**
   * Créer une mesure nouvelle sectorielle
   */
  static async createSectoralMeasure(data: {
    measureCode: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    description?: string;
    entityType: string; // "ACTION" or "ACTIVITY"
    ministryId: string;
    programId?: string;
    actionId?: string;
    activityId?: string;
    category?: string;
    priority?: number;
    quantityY1?: number;
    unitCostY1?: number;
    quantityY2?: number;
    unitCostY2?: number;
    quantityY3?: number;
    unitCostY3?: number;
    economicNatureId?: string;
    fundingSourceId?: string;
    justification?: string;
    expectedImpact?: string;
    performanceIndicator?: string;
    fiscalYear: number;
    createdBy?: string;
  }) {
    // Vérifier l'unicité du code mesure
    const existing = await prisma.sectoralMeasure.findUnique({
      where: { measureCode: data.measureCode },
    });

    if (existing) {
      throw new BadRequestError(
        `Une mesure avec le code ${data.measureCode} existe déjà`
      );
    }

    // Valider entityType
    if (!['ACTION', 'ACTIVITY'].includes(data.entityType)) {
      throw new BadRequestError(
        'entityType doit être "ACTION" ou "ACTIVITY"'
      );
    }

    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Vérifier la cohérence de la relation polymorphique
    if (data.entityType === 'ACTION' && !data.actionId) {
      throw new BadRequestError(
        'actionId est requis quand entityType est ACTION'
      );
    }

    if (data.entityType === 'ACTIVITY' && !data.activityId) {
      throw new BadRequestError(
        'activityId est requis quand entityType est ACTIVITY'
      );
    }

    // Calculer les coûts totaux (quantité × coût unitaire)
    const totalCostY1 = (data.quantityY1 || 0) * (data.unitCostY1 || 0);
    const totalCostY2 = (data.quantityY2 || 0) * (data.unitCostY2 || 0);
    const totalCostY3 = (data.quantityY3 || 0) * (data.unitCostY3 || 0);
    const totalCost = totalCostY1 + totalCostY2 + totalCostY3;

    return await prisma.sectoralMeasure.create({
      data: {
        measureCode: data.measureCode,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        entityType: data.entityType,
        ministryId: data.ministryId,
        programId: data.programId,
        actionId: data.actionId,
        activityId: data.activityId,
        category: data.category,
        priority: data.priority,
        quantityY1: data.quantityY1 || 0,
        unitCostY1: data.unitCostY1 || 0,
        totalCostY1,
        quantityY2: data.quantityY2 || 0,
        unitCostY2: data.unitCostY2 || 0,
        totalCostY2,
        quantityY3: data.quantityY3 || 0,
        unitCostY3: data.unitCostY3 || 0,
        totalCostY3,
        totalCost,
        economicNatureId: data.economicNatureId,
        fundingSourceId: data.fundingSourceId,
        justification: data.justification,
        expectedImpact: data.expectedImpact,
        performanceIndicator: data.performanceIndicator,
        status: 'DRAFT',
        fiscalYear: data.fiscalYear,
        createdBy: data.createdBy,
      },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, code: true, name: true } },
        activity: { select: { id: true, code: true, name: true } },
        economicNature: { select: { id: true, code: true, name: true } },
        fundingSource: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Obtenir toutes les mesures sectorielles avec filtres et pagination
   */
  static async getSectoralMeasures(filters: {
    ministryId?: string;
    programId?: string;
    actionId?: string;
    activityId?: string;
    entityType?: string;
    category?: string;
    status?: string;
    fiscalYear?: number;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (otherFilters.ministryId) where.ministryId = otherFilters.ministryId;
    if (otherFilters.programId) where.programId = otherFilters.programId;
    if (otherFilters.actionId) where.actionId = otherFilters.actionId;
    if (otherFilters.activityId) where.activityId = otherFilters.activityId;
    if (otherFilters.entityType) where.entityType = otherFilters.entityType;
    if (otherFilters.category) where.category = otherFilters.category;
    if (otherFilters.status) where.status = otherFilters.status;
    if (otherFilters.fiscalYear) where.fiscalYear = otherFilters.fiscalYear;

    const [data, total] = await Promise.all([
      prisma.sectoralMeasure.findMany({
        where,
        include: {
          ministry: { select: { id: true, name: true } },
          program: { select: { id: true, name: true } },
          action: { select: { id: true, code: true, name: true } },
          activity: { select: { id: true, code: true, name: true } },
          economicNature: { select: { id: true, code: true, name: true } },
          fundingSource: { select: { id: true, code: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.sectoralMeasure.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une mesure sectorielle par ID
   */
  static async getSectoralMeasure(id: string) {
    const measure = await prisma.sectoralMeasure.findUnique({
      where: { id },
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, code: true, name: true } },
        activity: { select: { id: true, code: true, name: true } },
        economicNature: { select: { id: true, code: true, name: true } },
        fundingSource: { select: { id: true, code: true, name: true } },
        actionPlans: true,
      },
    });

    if (!measure) {
      throw new NotFoundError('Mesure sectorielle non trouvée');
    }

    return measure;
  }

  /**
   * Mettre à jour une mesure sectorielle
   */
  static async updateSectoralMeasure(
    id: string,
    data: Partial<{
      name: string;
      nameAr: string;
      nameEn: string;
      description: string;
      category: string;
      priority: number;
      quantityY1: number;
      unitCostY1: number;
      quantityY2: number;
      unitCostY2: number;
      quantityY3: number;
      unitCostY3: number;
      economicNatureId: string;
      fundingSourceId: string;
      justification: string;
      expectedImpact: string;
      performanceIndicator: string;
    }>
  ) {
    const measure = await this.getSectoralMeasure(id);

    // Ne peut pas modifier une mesure validée ou intégrée
    if (['VALIDATED', 'INTEGRATED'].includes(measure.status)) {
      throw new BadRequestError(
        'Impossible de modifier une mesure validée ou intégrée'
      );
    }

    // Recalculer les coûts totaux si nécessaire
    const updateData: any = { ...data };

    if (
      data.quantityY1 !== undefined ||
      data.unitCostY1 !== undefined ||
      data.quantityY2 !== undefined ||
      data.unitCostY2 !== undefined ||
      data.quantityY3 !== undefined ||
      data.unitCostY3 !== undefined
    ) {
      const q1 =
        data.quantityY1 !== undefined
          ? data.quantityY1
          : parseFloat(measure.quantityY1.toString());
      const u1 =
        data.unitCostY1 !== undefined
          ? data.unitCostY1
          : parseFloat(measure.unitCostY1.toString());
      const q2 =
        data.quantityY2 !== undefined
          ? data.quantityY2
          : parseFloat(measure.quantityY2.toString());
      const u2 =
        data.unitCostY2 !== undefined
          ? data.unitCostY2
          : parseFloat(measure.unitCostY2.toString());
      const q3 =
        data.quantityY3 !== undefined
          ? data.quantityY3
          : parseFloat(measure.quantityY3.toString());
      const u3 =
        data.unitCostY3 !== undefined
          ? data.unitCostY3
          : parseFloat(measure.unitCostY3.toString());

      updateData.totalCostY1 = q1 * u1;
      updateData.totalCostY2 = q2 * u2;
      updateData.totalCostY3 = q3 * u3;
      updateData.totalCost =
        updateData.totalCostY1 + updateData.totalCostY2 + updateData.totalCostY3;
    }

    return await prisma.sectoralMeasure.update({
      where: { id },
      data: updateData,
      include: {
        ministry: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        action: { select: { id: true, code: true, name: true } },
        activity: { select: { id: true, code: true, name: true } },
        economicNature: { select: { id: true, code: true, name: true } },
        fundingSource: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Supprimer une mesure sectorielle
   */
  static async deleteSectoralMeasure(id: string) {
    const measure = await this.getSectoralMeasure(id);

    // Ne peut pas supprimer une mesure validée ou intégrée
    if (['VALIDATED', 'INTEGRATED'].includes(measure.status)) {
      throw new BadRequestError(
        'Impossible de supprimer une mesure validée ou intégrée'
      );
    }

    return await prisma.sectoralMeasure.delete({
      where: { id },
    });
  }

  /**
   * Soumettre une mesure pour validation
   */
  static async submitForValidation(id: string, submittedBy: string) {
    const measure = await this.getSectoralMeasure(id);

    if (measure.status !== 'DRAFT') {
      throw new BadRequestError(
        'Seules les mesures en brouillon peuvent être soumises'
      );
    }

    return await prisma.sectoralMeasure.update({
      where: { id },
      data: {
        status: 'PROPOSED',
        submittedAt: new Date(),
        submittedBy,
      },
      include: {
        ministry: { select: { id: true, name: true } },
        action: { select: { id: true, code: true, name: true } },
        activity: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Valider une mesure
   */
  static async validateMeasure(id: string, validatedBy: string) {
    const measure = await this.getSectoralMeasure(id);

    if (measure.status !== 'PROPOSED') {
      throw new BadRequestError(
        'Seules les mesures proposées peuvent être validées'
      );
    }

    return await prisma.sectoralMeasure.update({
      where: { id },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
        validatedBy,
      },
      include: {
        ministry: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Rejeter une mesure
   */
  static async rejectMeasure(
    id: string,
    rejectionReason: string,
    validatedBy: string
  ) {
    const measure = await this.getSectoralMeasure(id);

    if (measure.status !== 'PROPOSED') {
      throw new BadRequestError(
        'Seules les mesures proposées peuvent être rejetées'
      );
    }

    return await prisma.sectoralMeasure.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        validatedAt: new Date(),
        validatedBy,
      },
    });
  }

  /**
   * Obtenir un résumé par ministère
   */
  static async getSummaryByMinistry(fiscalYear?: number): Promise<any[]> {
    const where: any = {
      status: { in: ['VALIDATED', 'INTEGRATED'] },
    };

    if (fiscalYear) {
      where.fiscalYear = fiscalYear;
    }

    const summary = await prisma.sectoralMeasure.groupBy({
      by: ['ministryId'],
      where,
      _sum: {
        totalCostY1: true,
        totalCostY2: true,
        totalCostY3: true,
        totalCost: true,
      },
      _count: {
        id: true,
      },
    });

    // Enrichir avec les noms des ministères (optimisé - pas de N+1)
    // Fetch all ministries in a single query
    const ministryIds = [...new Set(summary.map(s => s.ministryId))];
    const ministries = await prisma.ministry.findMany({
      where: { id: { in: ministryIds } },
      select: { id: true, name: true }
    });

    // Create a map for O(1) lookups
    const ministryMap = new Map(ministries.map(m => [m.id, m.name]));

    // Map in memory
    const enriched = summary.map(s => ({
      ministryId: s.ministryId,
      ministryName: ministryMap.get(s.ministryId) || 'Unknown',
      measureCount: s._count.id,
      totalCostY1: s._sum.totalCostY1,
      totalCostY2: s._sum.totalCostY2,
      totalCostY3: s._sum.totalCostY3,
      totalCost: s._sum.totalCost,
    }));

    return enriched;
  }

  /**
   * Obtenir un résumé par catégorie
   */
  static async getSummaryByCategory(fiscalYear?: number): Promise<any[]> {
    const where: any = {
      status: { in: ['VALIDATED', 'INTEGRATED'] },
    };

    if (fiscalYear) {
      where.fiscalYear = fiscalYear;
    }

    const summary = await prisma.sectoralMeasure.groupBy({
      by: ['category'],
      where,
      _sum: {
        totalCostY1: true,
        totalCostY2: true,
        totalCostY3: true,
        totalCost: true,
      },
      _count: {
        id: true,
      },
    });

    return summary.map((s) => ({
      category: s.category || 'NON_CATEGORISE',
      measureCount: s._count.id,
      totalCostY1: s._sum.totalCostY1,
      totalCostY2: s._sum.totalCostY2,
      totalCostY3: s._sum.totalCostY3,
      totalCost: s._sum.totalCost,
    }));
  }

  /**
   * Obtenir un résumé par action
   */
  static async getSummaryByAction(
    ministryId?: string,
    fiscalYear?: number
  ): Promise<any[]> {
    const where: any = {
      entityType: 'ACTION',
      status: { in: ['VALIDATED', 'INTEGRATED'] },
    };

    if (ministryId) where.ministryId = ministryId;
    if (fiscalYear) where.fiscalYear = fiscalYear;

    const measures = await prisma.sectoralMeasure.findMany({
      where,
      include: {
        action: { select: { code: true, name: true } },
        ministry: { select: { name: true } },
      },
    });

    // Grouper par action
    const grouped = measures.reduce((acc: any, measure) => {
      const actionId = measure.actionId || 'UNKNOWN';

      if (!acc[actionId]) {
        acc[actionId] = {
          actionId,
          actionCode: measure.action?.code || '-',
          actionName: measure.action?.name || '-',
          ministryName: measure.ministry?.name || '-',
          measureCount: 0,
          totalCostY1: 0,
          totalCostY2: 0,
          totalCostY3: 0,
          totalCost: 0,
        };
      }

      acc[actionId].measureCount++;
      acc[actionId].totalCostY1 += parseFloat(measure.totalCostY1.toString());
      acc[actionId].totalCostY2 += parseFloat(measure.totalCostY2.toString());
      acc[actionId].totalCostY3 += parseFloat(measure.totalCostY3.toString());
      acc[actionId].totalCost += parseFloat(measure.totalCost.toString());

      return acc;
    }, {});

    return Object.values(grouped);
  }

  /**
   * Obtenir un résumé par activité
   */
  static async getSummaryByActivity(
    ministryId?: string,
    fiscalYear?: number
  ): Promise<any[]> {
    const where: any = {
      entityType: 'ACTIVITY',
      status: { in: ['VALIDATED', 'INTEGRATED'] },
    };

    if (ministryId) where.ministryId = ministryId;
    if (fiscalYear) where.fiscalYear = fiscalYear;

    const measures = await prisma.sectoralMeasure.findMany({
      where,
      include: {
        activity: { select: { code: true, name: true } },
        action: { select: { name: true } },
        ministry: { select: { name: true } },
      },
    });

    // Grouper par activité
    const grouped = measures.reduce((acc: any, measure) => {
      const activityId = measure.activityId || 'UNKNOWN';

      if (!acc[activityId]) {
        acc[activityId] = {
          activityId,
          activityCode: measure.activity?.code || '-',
          activityName: measure.activity?.name || '-',
          actionName: measure.action?.name || '-',
          ministryName: measure.ministry?.name || '-',
          measureCount: 0,
          totalCostY1: 0,
          totalCostY2: 0,
          totalCostY3: 0,
          totalCost: 0,
        };
      }

      acc[activityId].measureCount++;
      acc[activityId].totalCostY1 += parseFloat(measure.totalCostY1.toString());
      acc[activityId].totalCostY2 += parseFloat(measure.totalCostY2.toString());
      acc[activityId].totalCostY3 += parseFloat(measure.totalCostY3.toString());
      acc[activityId].totalCost += parseFloat(measure.totalCost.toString());

      return acc;
    }, {});

    return Object.values(grouped);
  }

  // =====================================================
  // WORKFLOW METHODS (5-Level Workflow)
  // =====================================================

  /**
   * Submit measure for review
   */
  static async submit(id: string, userId: string) {
    const measure = await this.getSectoralMeasure(id);

    await WorkflowService.transitionStatus({
      documentType: 'SECTORAL_MEASURE',
      documentId: id,
      documentCode: measure.measureCode,
      toStatus: WorkflowStatus.SUBMITTED,
      userId,
    });

    return await this.getSectoralMeasure(id);
  }

  /**
   * Start review of measure
   */
  static async startReview(id: string, userId: string) {
    const measure = await this.getSectoralMeasure(id);

    await WorkflowService.transitionStatus({
      documentType: 'SECTORAL_MEASURE',
      documentId: id,
      documentCode: measure.measureCode,
      toStatus: WorkflowStatus.UNDER_REVIEW,
      userId,
    });

    return await this.getSectoralMeasure(id);
  }

  /**
   * Validate measure
   */
  static async validate(id: string, userId: string, comment?: string) {
    const measure = await this.getSectoralMeasure(id);

    await WorkflowService.transitionStatus({
      documentType: 'SECTORAL_MEASURE',
      documentId: id,
      documentCode: measure.measureCode,
      toStatus: WorkflowStatus.VALIDATED,
      userId,
      comment,
    });

    return await this.getSectoralMeasure(id);
  }

  /**
   * Approve measure
   */
  static async approve(id: string, userId: string, comment?: string) {
    const measure = await this.getSectoralMeasure(id);

    await WorkflowService.transitionStatus({
      documentType: 'SECTORAL_MEASURE',
      documentId: id,
      documentCode: measure.measureCode,
      toStatus: WorkflowStatus.APPROVED,
      userId,
      comment,
    });

    return await this.getSectoralMeasure(id);
  }

  /**
   * Reject measure
   */
  static async reject(id: string, userId: string, reason: string) {
    const measure = await this.getSectoralMeasure(id);

    await WorkflowService.transitionStatus({
      documentType: 'SECTORAL_MEASURE',
      documentId: id,
      documentCode: measure.measureCode,
      toStatus: WorkflowStatus.REJECTED,
      userId,
      rejectionReason: reason,
    });

    return await this.getSectoralMeasure(id);
  }

  /**
   * Return measure to draft
   */
  static async returnToDraft(id: string, userId: string, comment?: string) {
    const measure = await this.getSectoralMeasure(id);

    await WorkflowService.transitionStatus({
      documentType: 'SECTORAL_MEASURE',
      documentId: id,
      documentCode: measure.measureCode,
      toStatus: WorkflowStatus.DRAFT,
      userId,
      comment,
    });

    return await this.getSectoralMeasure(id);
  }
}
