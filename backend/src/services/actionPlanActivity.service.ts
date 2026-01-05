import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { ActionPlanService } from './actionPlan.service';

const prisma = new PrismaClient();

export class ActionPlanActivityService {
  /**
   * Créer une activité dans un plan d'action
   */
  static async createActivity(data: {
    activityCode: string;
    name: string;
    description?: string;
    actionPlanId: string;
    orderIndex?: number;
    dependencies?: string;
    plannedStartDate?: Date;
    plannedEndDate?: Date;
    quantityY1?: number;
    unitCostY1?: number;
    quantityY2?: number;
    unitCostY2?: number;
    quantityY3?: number;
    unitCostY3?: number;
    assignedTo?: string;
    resourceType?: string;
    deliverables?: any;
  }) {
    // Vérifier que le plan d'action existe
    const plan = await prisma.actionPlan.findUnique({
      where: { id: data.actionPlanId },
    });

    if (!plan) {
      throw new NotFoundError('Plan d\'action non trouvé');
    }

    // Vérifier l'unicité du code activité dans le plan
    const existing = await prisma.actionPlanActivity.findUnique({
      where: {
        actionPlanId_activityCode: {
          actionPlanId: data.actionPlanId,
          activityCode: data.activityCode,
        },
      },
    });

    if (existing) {
      throw new BadRequestError(
        `Une activité avec le code ${data.activityCode} existe déjà dans ce plan`
      );
    }

    // Calculer les coûts totaux (quantité × coût unitaire)
    const totalCostY1 = (data.quantityY1 || 0) * (data.unitCostY1 || 0);
    const totalCostY2 = (data.quantityY2 || 0) * (data.unitCostY2 || 0);
    const totalCostY3 = (data.quantityY3 || 0) * (data.unitCostY3 || 0);
    const totalCost = totalCostY1 + totalCostY2 + totalCostY3;

    // Déterminer l'ordre si non fourni
    let orderIndex = data.orderIndex;
    if (orderIndex === undefined) {
      const maxOrder = await prisma.actionPlanActivity.aggregate({
        where: { actionPlanId: data.actionPlanId },
        _max: { orderIndex: true },
      });
      orderIndex = (maxOrder._max.orderIndex || 0) + 1;
    }

    const activity = await prisma.actionPlanActivity.create({
      data: {
        activityCode: data.activityCode,
        name: data.name,
        description: data.description,
        actionPlanId: data.actionPlanId,
        orderIndex,
        dependencies: data.dependencies,
        plannedStartDate: data.plannedStartDate,
        plannedEndDate: data.plannedEndDate,
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
        assignedTo: data.assignedTo,
        resourceType: data.resourceType,
        deliverables: data.deliverables,
        status: 'PLANNED',
        progress: 0,
      },
    });

    // Recalculer les coûts du plan
    await ActionPlanService.recalculatePlanCosts(data.actionPlanId);

    return activity;
  }

  /**
   * Obtenir toutes les activités d'un plan d'action
   */
  static async getActivitiesByPlan(actionPlanId: string) {
    return await prisma.actionPlanActivity.findMany({
      where: { actionPlanId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Obtenir une activité par ID
   */
  static async getActivity(id: string) {
    const activity = await prisma.actionPlanActivity.findUnique({
      where: { id },
      include: {
        actionPlan: {
          select: {
            id: true,
            planCode: true,
            name: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundError('Activité non trouvée');
    }

    return activity;
  }

  /**
   * Mettre à jour une activité
   */
  static async updateActivity(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      orderIndex: number;
      dependencies: string;
      plannedStartDate: Date;
      plannedEndDate: Date;
      actualStartDate: Date;
      actualEndDate: Date;
      quantityY1: number;
      unitCostY1: number;
      quantityY2: number;
      unitCostY2: number;
      quantityY3: number;
      unitCostY3: number;
      assignedTo: string;
      resourceType: string;
      deliverables: any;
      status: string;
      progress: number;
      notes: string;
    }>
  ) {
    const activity = await this.getActivity(id);

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
          : parseFloat(activity.quantityY1.toString());
      const u1 =
        data.unitCostY1 !== undefined
          ? data.unitCostY1
          : parseFloat(activity.unitCostY1.toString());
      const q2 =
        data.quantityY2 !== undefined
          ? data.quantityY2
          : parseFloat(activity.quantityY2.toString());
      const u2 =
        data.unitCostY2 !== undefined
          ? data.unitCostY2
          : parseFloat(activity.unitCostY2.toString());
      const q3 =
        data.quantityY3 !== undefined
          ? data.quantityY3
          : parseFloat(activity.quantityY3.toString());
      const u3 =
        data.unitCostY3 !== undefined
          ? data.unitCostY3
          : parseFloat(activity.unitCostY3.toString());

      updateData.totalCostY1 = q1 * u1;
      updateData.totalCostY2 = q2 * u2;
      updateData.totalCostY3 = q3 * u3;
      updateData.totalCost =
        updateData.totalCostY1 + updateData.totalCostY2 + updateData.totalCostY3;
    }

    const updated = await prisma.actionPlanActivity.update({
      where: { id },
      data: updateData,
    });

    // Recalculer les coûts du plan
    await ActionPlanService.recalculatePlanCosts(activity.actionPlanId);

    // Recalculer la progression du plan si le statut a changé
    if (data.status || data.progress !== undefined) {
      await ActionPlanService.calculateProgress(activity.actionPlanId);
    }

    return updated;
  }

  /**
   * Supprimer une activité
   */
  static async deleteActivity(id: string) {
    const activity = await this.getActivity(id);

    await prisma.actionPlanActivity.delete({
      where: { id },
    });

    // Recalculer les coûts du plan
    await ActionPlanService.recalculatePlanCosts(activity.actionPlanId);

    return { success: true };
  }

  /**
   * Réorganiser les activités (changer l'ordre)
   */
  static async reorderActivities(
    actionPlanId: string,
    activityOrders: Array<{ id: string; orderIndex: number }>
  ) {
    // Validation des paramètres
    if (!activityOrders || !Array.isArray(activityOrders)) {
      throw new BadRequestError('activityOrders est requis et doit être un tableau');
    }

    if (activityOrders.length === 0) {
      throw new BadRequestError('activityOrders ne peut pas être vide');
    }

    // Vérifier que le plan existe
    await ActionPlanService.getActionPlan(actionPlanId);

    // Mettre à jour l'ordre de chaque activité
    await Promise.all(
      activityOrders.map((item) =>
        prisma.actionPlanActivity.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return await this.getActivitiesByPlan(actionPlanId);
  }

  /**
   * Marquer une activité comme démarrée
   */
  static async startActivity(id: string) {
    const activity = await this.getActivity(id);

    if (activity.status !== 'PLANNED') {
      throw new BadRequestError(
        'Seules les activités planifiées peuvent être démarrées'
      );
    }

    const updated = await prisma.actionPlanActivity.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
        progress: 0,
      },
    });

    await ActionPlanService.calculateProgress(activity.actionPlanId);

    return updated;
  }

  /**
   * Marquer une activité comme terminée
   */
  static async completeActivity(id: string) {
    const activity = await this.getActivity(id);

    if (activity.status !== 'IN_PROGRESS') {
      throw new BadRequestError(
        'Seules les activités en cours peuvent être terminées'
      );
    }

    const updated = await prisma.actionPlanActivity.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date(),
        progress: 100,
      },
    });

    await ActionPlanService.calculateProgress(activity.actionPlanId);

    return updated;
  }

  /**
   * Mettre à jour la progression d'une activité
   */
  static async updateProgress(id: string, progress: number) {
    if (progress < 0 || progress > 100) {
      throw new BadRequestError('La progression doit être entre 0 et 100');
    }

    const activity = await this.getActivity(id);

    // Déterminer le statut en fonction de la progression
    let status = activity.status;
    if (progress === 0 && status === 'PLANNED') {
      status = 'PLANNED';
    } else if (progress > 0 && progress < 100) {
      status = 'IN_PROGRESS';
      if (!activity.actualStartDate) {
        // Démarrer automatiquement si pas encore démarré
        await prisma.actionPlanActivity.update({
          where: { id },
          data: { actualStartDate: new Date() },
        });
      }
    } else if (progress === 100) {
      status = 'COMPLETED';
    }

    const updated = await prisma.actionPlanActivity.update({
      where: { id },
      data: {
        progress,
        status,
        actualEndDate: progress === 100 ? new Date() : activity.actualEndDate,
      },
    });

    await ActionPlanService.calculateProgress(activity.actionPlanId);

    return updated;
  }

  /**
   * Importer des activités en masse à partir d'un tableau
   */
  static async bulkImportActivities(
    actionPlanId: string,
    activities: Array<{
      activityCode: string;
      name: string;
      description?: string;
      quantityY1?: number;
      unitCostY1?: number;
      quantityY2?: number;
      unitCostY2?: number;
      quantityY3?: number;
      unitCostY3?: number;
      plannedStartDate?: Date;
      plannedEndDate?: Date;
      assignedTo?: string;
    }>
  ) {
    // Vérifier que le plan existe
    await ActionPlanService.getActionPlan(actionPlanId);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ activityCode: string; error: string }>,
    };

    for (let i = 0; i < activities.length; i++) {
      try {
        await this.createActivity({
          ...activities[i],
          actionPlanId,
          orderIndex: i + 1,
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          activityCode: activities[i].activityCode,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Obtenir un résumé des activités par statut
   */
  static async getActivitiesSummaryByStatus(actionPlanId: string) {
    const activities = await this.getActivitiesByPlan(actionPlanId);

    const summary = activities.reduce(
      (acc, activity) => {
        acc.total++;
        acc.byStatus[activity.status] = (acc.byStatus[activity.status] || 0) + 1;
        acc.totalCost += parseFloat(activity.totalCost.toString());

        if (activity.status === 'COMPLETED') {
          acc.completedCost += parseFloat(activity.totalCost.toString());
        }

        return acc;
      },
      {
        total: 0,
        byStatus: {} as Record<string, number>,
        totalCost: 0,
        completedCost: 0,
      }
    );

    return summary;
  }

  /**
   * Calculer le chemin critique (activités sans dépendances résolues)
   */
  static async calculateCriticalPath(actionPlanId: string) {
    const activities = await this.getActivitiesByPlan(actionPlanId);

    // Identifier les activités du chemin critique
    const criticalActivities = activities.filter((activity) => {
      // Activité sans dépendances ou dépendances non résolues
      if (!activity.dependencies) return true;

      const depIds = activity.dependencies.split(',').map((id) => id.trim());
      const unresolvedDeps = activities.filter(
        (a) => depIds.includes(a.id) && a.status !== 'COMPLETED'
      );

      return unresolvedDeps.length > 0;
    });

    return {
      totalActivities: activities.length,
      criticalActivities: criticalActivities.length,
      activities: criticalActivities.map((a) => ({
        id: a.id,
        activityCode: a.activityCode,
        name: a.name,
        status: a.status,
        dependencies: a.dependencies,
      })),
    };
  }
}
