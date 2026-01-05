import { Request, Response, NextFunction } from 'express';
import { ActionPlanService } from '../services/actionPlan.service';
import { ActionPlanActivityService } from '../services/actionPlanActivity.service';
import { ActionPlanExportService } from '../services/actionPlanExport.service';
import prisma from '../config/database';

export class ActionPlanController {
  /**
   * Get all action plans with filters
   */
  static async getActionPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        ministryId: req.query.ministryId as string | undefined,
        sectoralMeasureId: req.query.sectoralMeasureId as string | undefined,
        fiscalYear: req.query.fiscalYear ? parseInt(req.query.fiscalYear as string) : undefined,
        status: req.query.status as string | undefined,
      };

      const plans = await ActionPlanService.getActionPlans(filters);
      res.json(plans);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get action plan by ID
   */
  static async getActionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plan = await ActionPlanService.getActionPlan(id);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create action plan
   */
  static async createActionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = req.body.createdBy || (req as any).user?.id;
      const plan = await ActionPlanService.createActionPlan({
        ...req.body,
        createdBy,
      });
      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update action plan
   */
  static async updateActionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plan = await ActionPlanService.updateActionPlan(id, req.body);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete action plan
   */
  static async deleteActionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ActionPlanService.deleteActionPlan(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate plan costs
   */
  static async recalculatePlanCosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plan = await ActionPlanService.recalculatePlanCosts(id);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate plan progress
   */
  static async calculateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plan = await ActionPlanService.calculateProgress(id);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate action plan
   */
  static async validateActionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedBy = req.body.validatedBy || (req as any).user?.id;
      const plan = await ActionPlanService.validateActionPlan(id, validatedBy);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary by ministry
   */
  static async getSummaryByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await ActionPlanService.getSummaryByMinistry(fiscalYear);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get performance indicators
   */
  static async getPerformanceIndicators(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const indicators = await ActionPlanService.getPerformanceIndicators(id);
      res.json(indicators);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate action plan
   */
  static async duplicateActionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPlanCode } = req.body;
      const createdBy = req.body.createdBy || (req as any).user?.id;

      const newPlan = await ActionPlanService.duplicateActionPlan(id, newPlanCode, createdBy);
      res.status(201).json(newPlan);
    } catch (error) {
      next(error);
    }
  }

  // ========== ACTIVITY ENDPOINTS ==========

  /**
   * Get all activities for a plan
   */
  static async getActivitiesByPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      const activities = await ActionPlanActivityService.getActivitiesByPlan(planId);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity by ID
   */
  static async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { activityId } = req.params;
      const activity = await ActionPlanActivityService.getActivity(activityId);
      res.json(activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create activity
   */
  static async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      const activity = await ActionPlanActivityService.createActivity({
        ...req.body,
        actionPlanId: planId,
      });
      res.status(201).json(activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update activity
   */
  static async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { activityId } = req.params;
      const activity = await ActionPlanActivityService.updateActivity(activityId, req.body);
      res.json(activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete activity
   */
  static async deleteActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { activityId } = req.params;
      await ActionPlanActivityService.deleteActivity(activityId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder activities
   * Supports two formats:
   * - { activityOrders: [{ id: string, orderIndex: number }] } - explicit ordering
   * - { activityIds: [string] } - order derived from array position
   */
  static async reorderActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      let { activityOrders, activityIds } = req.body;

      // Support both formats: activityOrders (explicit) or activityIds (implicit ordering)
      if (!activityOrders && activityIds && Array.isArray(activityIds)) {
        activityOrders = activityIds.map((id: string, index: number) => ({
          id,
          orderIndex: index + 1,
        }));
      }

      // Validate input
      if (!activityOrders || !Array.isArray(activityOrders)) {
        res.status(400).json({
          status: 'error',
          message: 'activityOrders ou activityIds est requis et doit être un tableau',
        });
        return;
      }

      const activities = await ActionPlanActivityService.reorderActivities(
        planId,
        activityOrders
      );
      res.json(activities);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start activity
   */
  static async startActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { activityId } = req.params;
      const activity = await ActionPlanActivityService.startActivity(activityId);
      res.json(activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete activity
   */
  static async completeActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { activityId } = req.params;
      const activity = await ActionPlanActivityService.completeActivity(activityId);
      res.json(activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update activity progress
   */
  static async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { activityId } = req.params;
      const { progress } = req.body;
      const activity = await ActionPlanActivityService.updateProgress(activityId, progress);
      res.json(activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk import activities
   */
  static async bulkImportActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      const { activities } = req.body;
      const result = await ActionPlanActivityService.bulkImportActivities(planId, activities);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activities summary by status
   */
  static async getActivitiesSummaryByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      const summary = await ActionPlanActivityService.getActivitiesSummaryByStatus(planId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate critical path
   */
  static async calculateCriticalPath(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = req.params;
      const criticalPath = await ActionPlanActivityService.calculateCriticalPath(planId);
      res.json(criticalPath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export action plan to PDF
   */
  static async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buffer = await ActionPlanExportService.generatePDF(id);

      const plan = await prisma.actionPlan.findUnique({ where: { id } });
      const filename = `plan-action-${plan?.planCode || id}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export action plan to Excel
   */
  static async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buffer = await ActionPlanExportService.generateExcel(id);

      const plan = await prisma.actionPlan.findUnique({ where: { id } });
      const filename = `plan-action-${plan?.planCode || id}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export action plan to CSV
   */
  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buffer = await ActionPlanExportService.generateCSV(id);

      const plan = await prisma.actionPlan.findUnique({ where: { id } });
      const filename = `plan-action-${plan?.planCode || id}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default ActionPlanController;
