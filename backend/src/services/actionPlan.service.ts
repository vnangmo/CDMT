import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { WorkflowService, WorkflowStatus } from './workflow.service';

const prisma = new PrismaClient();

export class ActionPlanService {
  /**
   * Créer un plan d'action pour une mesure sectorielle
   */
  static async createActionPlan(data: {
    planCode: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    description?: string;
    sectoralMeasureId: string;
    ministryId: string;
    fiscalYear: number;
    startDate?: Date;
    endDate?: Date;
    duration?: number;
    objectives?: string;
    expectedResults?: string;
    performanceIndicators?: any;
    humanResources?: string;
    technicalResources?: string;
    institutionalSupport?: string;
    risks?: any;
    mitigationMeasures?: string;
    responsibleEntity?: string;
    coordinator?: string;
    createdBy?: string;
  }) {
    // Vérifier l'unicité du code plan
    const existing = await prisma.actionPlan.findUnique({
      where: { planCode: data.planCode },
    });

    if (existing) {
      throw new BadRequestError(
        `Un plan d'action avec le code ${data.planCode} existe déjà`
      );
    }

    // Vérifier que la mesure sectorielle existe
    const measure = await prisma.sectoralMeasure.findUnique({
      where: { id: data.sectoralMeasureId },
    });

    if (!measure) {
      throw new NotFoundError('Mesure sectorielle non trouvée');
    }

    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    return await prisma.actionPlan.create({
      data: {
        planCode: data.planCode,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        sectoralMeasureId: data.sectoralMeasureId,
        ministryId: data.ministryId,
        fiscalYear: data.fiscalYear,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        objectives: data.objectives,
        expectedResults: data.expectedResults,
        performanceIndicators: data.performanceIndicators,
        humanResources: data.humanResources,
        technicalResources: data.technicalResources,
        institutionalSupport: data.institutionalSupport,
        risks: data.risks,
        mitigationMeasures: data.mitigationMeasures,
        responsibleEntity: data.responsibleEntity,
        coordinator: data.coordinator,
        status: 'DRAFT',
        progress: 0,
        totalCostY1: 0,
        totalCostY2: 0,
        totalCostY3: 0,
        totalCost: 0,
        createdBy: data.createdBy,
      },
      include: {
        sectoralMeasure: {
          select: { measureCode: true, name: true },
        },
        ministry: {
          select: { name: true },
        },
      },
    });
  }

  /**
   * Obtenir tous les plans d'action avec filtres
   */
  static async getActionPlans(filters: {
    ministryId?: string;
    sectoralMeasureId?: string;
    fiscalYear?: number;
    status?: string;
  }) {
    const where: any = {};

    if (filters.ministryId) where.ministryId = filters.ministryId;
    if (filters.sectoralMeasureId) where.sectoralMeasureId = filters.sectoralMeasureId;
    if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;
    if (filters.status) where.status = filters.status;

    return await prisma.actionPlan.findMany({
      where,
      include: {
        sectoralMeasure: {
          select: { measureCode: true, name: true },
        },
        ministry: {
          select: { name: true },
        },
        activities: {
          select: {
            id: true,
            activityCode: true,
            name: true,
            status: true,
            progress: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /**
   * Obtenir un plan d'action par ID
   */
  static async getActionPlan(id: string) {
    const plan = await prisma.actionPlan.findUnique({
      where: { id },
      include: {
        sectoralMeasure: {
          select: {
            id: true,
            measureCode: true,
            name: true,
            totalCostY1: true,
            totalCostY2: true,
            totalCostY3: true,
            totalCost: true,
          },
        },
        ministry: {
          select: { id: true, name: true },
        },
        activities: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan d\'action non trouvé');
    }

    return plan;
  }

  /**
   * Mettre à jour un plan d'action
   */
  static async updateActionPlan(
    id: string,
    data: Partial<{
      name: string;
      nameAr: string;
      nameEn: string;
      description: string;
      startDate: Date;
      endDate: Date;
      duration: number;
      objectives: string;
      expectedResults: string;
      performanceIndicators: any;
      humanResources: string;
      technicalResources: string;
      institutionalSupport: string;
      risks: any;
      mitigationMeasures: string;
      responsibleEntity: string;
      coordinator: string;
      status: string;
      progress: number;
    }>
  ) {
    await this.getActionPlan(id); // Vérifie l'existence

    return await prisma.actionPlan.update({
      where: { id },
      data,
      include: {
        sectoralMeasure: {
          select: { measureCode: true, name: true },
        },
        ministry: {
          select: { name: true },
        },
      },
    });
  }

  /**
   * Supprimer un plan d'action
   */
  static async deleteActionPlan(id: string) {
    await this.getActionPlan(id); // Vérifie l'existence

    return await prisma.actionPlan.delete({
      where: { id },
    });
  }

  /**
   * Recalculer les coûts totaux d'un plan d'action
   * Agrégation: ActionPlan.totalCostY = Σ(activities.totalCostY)
   */
  static async recalculatePlanCosts(planId: string) {
    const plan = await this.getActionPlan(planId);

    // Calculer les totaux à partir des activités
    const aggregated = plan.activities.reduce(
      (acc, activity) => {
        acc.totalCostY1 += parseFloat(activity.totalCostY1.toString());
        acc.totalCostY2 += parseFloat(activity.totalCostY2.toString());
        acc.totalCostY3 += parseFloat(activity.totalCostY3.toString());
        return acc;
      },
      { totalCostY1: 0, totalCostY2: 0, totalCostY3: 0 }
    );

    const totalCost =
      aggregated.totalCostY1 + aggregated.totalCostY2 + aggregated.totalCostY3;

    return await prisma.actionPlan.update({
      where: { id: planId },
      data: {
        totalCostY1: aggregated.totalCostY1,
        totalCostY2: aggregated.totalCostY2,
        totalCostY3: aggregated.totalCostY3,
        totalCost,
      },
    });
  }

  /**
   * Calculer la progression d'un plan d'action
   */
  static async calculateProgress(planId: string) {
    const plan = await this.getActionPlan(planId);

    if (plan.activities.length === 0) {
      return await prisma.actionPlan.update({
        where: { id: planId },
        data: { progress: 0 },
      });
    }

    // Calculer la moyenne de progression des activités
    const totalProgress = plan.activities.reduce((sum, activity) => {
      return sum + (activity.progress ? parseFloat(activity.progress.toString()) : 0);
    }, 0);

    const averageProgress = totalProgress / plan.activities.length;

    return await prisma.actionPlan.update({
      where: { id: planId },
      data: { progress: averageProgress },
    });
  }

  /**
   * Valider un plan d'action
   */
  static async validateActionPlan(planId: string, validatedBy: string) {
    const plan = await this.getActionPlan(planId);

    if (plan.status !== 'DRAFT') {
      throw new BadRequestError(
        'Seuls les plans en brouillon peuvent être validés'
      );
    }

    // Vérifier qu'il y a au moins une activité
    if (plan.activities.length === 0) {
      throw new BadRequestError(
        'Le plan doit contenir au moins une activité avant validation'
      );
    }

    return await prisma.actionPlan.update({
      where: { id: planId },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
        validatedBy,
      },
    });
  }

  /**
   * Obtenir un résumé par ministère
   */
  static async getSummaryByMinistry(fiscalYear?: number): Promise<any[]> {
    const where: any = {};

    if (fiscalYear) {
      where.fiscalYear = fiscalYear;
    }

    const summary = await prisma.actionPlan.groupBy({
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
      _avg: {
        progress: true,
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
      planCount: s._count.id,
      totalCostY1: s._sum.totalCostY1,
      totalCostY2: s._sum.totalCostY2,
      totalCostY3: s._sum.totalCostY3,
      totalCost: s._sum.totalCost,
      averageProgress: s._avg.progress,
    }));

    return enriched;
  }

  /**
   * Obtenir les indicateurs de performance d'un plan
   */
  static async getPerformanceIndicators(planId: string) {
    const plan = await this.getActionPlan(planId);

    const totalActivities = plan.activities.length;
    const completedActivities = plan.activities.filter(
      (a) => a.status === 'COMPLETED'
    ).length;
    const inProgressActivities = plan.activities.filter(
      (a) => a.status === 'IN_PROGRESS'
    ).length;
    const plannedActivities = plan.activities.filter(
      (a) => a.status === 'PLANNED'
    ).length;

    const completionRate =
      totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    // Calculer le taux d'exécution budgétaire
    const plannedBudget = parseFloat(plan.totalCost.toString());
    const executedBudget = plan.activities.reduce((sum, activity) => {
      if (activity.status === 'COMPLETED') {
        return sum + parseFloat(activity.totalCost.toString());
      }
      return sum;
    }, 0);

    const budgetExecutionRate =
      plannedBudget > 0 ? (executedBudget / plannedBudget) * 100 : 0;

    return {
      planId,
      planCode: plan.planCode,
      planName: plan.name,
      status: plan.status,
      progress: parseFloat(plan.progress?.toString() || '0'),
      activities: {
        total: totalActivities,
        completed: completedActivities,
        inProgress: inProgressActivities,
        planned: plannedActivities,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      budget: {
        planned: plannedBudget,
        executed: executedBudget,
        remaining: plannedBudget - executedBudget,
        executionRate: Math.round(budgetExecutionRate * 100) / 100,
      },
      timeline: {
        startDate: plan.startDate,
        endDate: plan.endDate,
        duration: plan.duration,
      },
    };
  }

  /**
   * Dupliquer un plan d'action
   */
  static async duplicateActionPlan(
    planId: string,
    newPlanCode: string,
    createdBy: string
  ) {
    const originalPlan = await this.getActionPlan(planId);

    // Vérifier l'unicité du nouveau code
    const existing = await prisma.actionPlan.findUnique({
      where: { planCode: newPlanCode },
    });

    if (existing) {
      throw new BadRequestError(`Le code ${newPlanCode} existe déjà`);
    }

    // Créer le nouveau plan
    const newPlan = await prisma.actionPlan.create({
      data: {
        planCode: newPlanCode,
        name: `${originalPlan.name} (copie)`,
        nameAr: originalPlan.nameAr,
        nameEn: originalPlan.nameEn,
        description: originalPlan.description,
        sectoralMeasureId: originalPlan.sectoralMeasureId,
        ministryId: originalPlan.ministryId,
        fiscalYear: originalPlan.fiscalYear,
        startDate: originalPlan.startDate,
        endDate: originalPlan.endDate,
        duration: originalPlan.duration,
        objectives: originalPlan.objectives,
        expectedResults: originalPlan.expectedResults,
        performanceIndicators: originalPlan.performanceIndicators as any,
        humanResources: originalPlan.humanResources,
        technicalResources: originalPlan.technicalResources,
        institutionalSupport: originalPlan.institutionalSupport,
        risks: originalPlan.risks as any,
        mitigationMeasures: originalPlan.mitigationMeasures,
        responsibleEntity: originalPlan.responsibleEntity,
        coordinator: originalPlan.coordinator,
        status: 'DRAFT',
        progress: 0,
        totalCostY1: 0,
        totalCostY2: 0,
        totalCostY3: 0,
        totalCost: 0,
        createdBy,
      },
    });

    // Dupliquer les activités
    for (const activity of originalPlan.activities) {
      await prisma.actionPlanActivity.create({
        data: {
          activityCode: activity.activityCode,
          name: activity.name,
          description: activity.description,
          actionPlanId: newPlan.id,
          orderIndex: activity.orderIndex,
          dependencies: activity.dependencies,
          plannedStartDate: activity.plannedStartDate,
          plannedEndDate: activity.plannedEndDate,
          quantityY1: activity.quantityY1,
          unitCostY1: activity.unitCostY1,
          totalCostY1: activity.totalCostY1,
          quantityY2: activity.quantityY2,
          unitCostY2: activity.unitCostY2,
          totalCostY2: activity.totalCostY2,
          quantityY3: activity.quantityY3,
          unitCostY3: activity.unitCostY3,
          totalCostY3: activity.totalCostY3,
          totalCost: activity.totalCost,
          assignedTo: activity.assignedTo,
          resourceType: activity.resourceType,
          deliverables: activity.deliverables as any,
          status: 'PLANNED',
          progress: 0,
        },
      });
    }

    // Recalculer les coûts
    await this.recalculatePlanCosts(newPlan.id);

    return await this.getActionPlan(newPlan.id);
  }

  // =====================================================
  // WORKFLOW METHODS (5-Level Workflow)
  // =====================================================

  /**
   * Submit action plan for review
   */
  static async submit(id: string, userId: string) {
    const plan = await this.getActionPlan(id);

    await WorkflowService.transitionStatus({
      documentType: 'ACTION_PLAN',
      documentId: id,
      documentCode: plan.planCode,
      toStatus: WorkflowStatus.SUBMITTED,
      userId,
    });

    return await this.getActionPlan(id);
  }

  /**
   * Start review of action plan
   */
  static async startReview(id: string, userId: string) {
    const plan = await this.getActionPlan(id);

    await WorkflowService.transitionStatus({
      documentType: 'ACTION_PLAN',
      documentId: id,
      documentCode: plan.planCode,
      toStatus: WorkflowStatus.UNDER_REVIEW,
      userId,
    });

    return await this.getActionPlan(id);
  }

  /**
   * Validate action plan
   */
  static async validate(id: string, userId: string, comment?: string) {
    const plan = await this.getActionPlan(id);

    await WorkflowService.transitionStatus({
      documentType: 'ACTION_PLAN',
      documentId: id,
      documentCode: plan.planCode,
      toStatus: WorkflowStatus.VALIDATED,
      userId,
      comment,
    });

    return await this.getActionPlan(id);
  }

  /**
   * Approve action plan
   */
  static async approve(id: string, userId: string, comment?: string) {
    const plan = await this.getActionPlan(id);

    await WorkflowService.transitionStatus({
      documentType: 'ACTION_PLAN',
      documentId: id,
      documentCode: plan.planCode,
      toStatus: WorkflowStatus.APPROVED,
      userId,
      comment,
    });

    return await this.getActionPlan(id);
  }

  /**
   * Reject action plan
   */
  static async reject(id: string, userId: string, reason: string) {
    const plan = await this.getActionPlan(id);

    await WorkflowService.transitionStatus({
      documentType: 'ACTION_PLAN',
      documentId: id,
      documentCode: plan.planCode,
      toStatus: WorkflowStatus.REJECTED,
      userId,
      rejectionReason: reason,
    });

    return await this.getActionPlan(id);
  }

  /**
   * Return action plan to draft
   */
  static async returnToDraft(id: string, userId: string, comment?: string) {
    const plan = await this.getActionPlan(id);

    await WorkflowService.transitionStatus({
      documentType: 'ACTION_PLAN',
      documentId: id,
      documentCode: plan.planCode,
      toStatus: WorkflowStatus.DRAFT,
      userId,
      comment,
    });

    return await this.getActionPlan(id);
  }
}
