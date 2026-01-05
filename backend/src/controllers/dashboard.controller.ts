import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AlertService } from '../services/alert.service';

export class DashboardController {
  /**
   * Get main dashboard statistics
   * GET /api/v1/dashboard/stats
   */
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const stats = await DashboardService.getStats(fiscalYear);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activities
   * GET /api/v1/dashboard/activities
   */
  static async getRecentActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const activities = await DashboardService.getRecentActivities(limit);

      res.status(200).json({
        status: 'success',
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget trends
   * GET /api/v1/dashboard/trends
   */
  static async getBudgetTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : new Date().getFullYear();
      const months = req.query.months ? parseInt(req.query.months as string) : 12;

      const trends = await DashboardService.getBudgetTrends(fiscalYear, months);

      res.status(200).json({
        status: 'success',
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ministry comparison data
   * GET /api/v1/dashboard/ministries
   */
  static async getMinistryComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : new Date().getFullYear();

      const comparison = await DashboardService.getMinistryComparison(fiscalYear);

      res.status(200).json({
        status: 'success',
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workflow statistics
   * GET /api/v1/dashboard/workflow-stats
   */
  static async getWorkflowStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getWorkflowStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all alerts
   * GET /api/v1/dashboard/alerts
   */
  static async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;
      const type = req.query.type as string | undefined;
      const severity = req.query.severity as string | undefined;
      const ministryId = req.query.ministryId as string | undefined;

      let alerts = await AlertService.getAllAlerts(fiscalYear);

      // Apply filters
      if (type) {
        alerts = alerts.filter((a) => a.type === type);
      }
      if (severity) {
        alerts = alerts.filter((a) => a.severity === severity);
      }
      if (ministryId) {
        alerts = alerts.filter((a) => a.ministryId === ministryId);
      }

      res.status(200).json({
        status: 'success',
        data: {
          alerts,
          total: alerts.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get alerts summary
   * GET /api/v1/dashboard/alerts/summary
   */
  static async getAlertsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await AlertService.getAlertsSummary(fiscalYear);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get critical alerts only
   * GET /api/v1/dashboard/alerts/critical
   */
  static async getCriticalAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const alerts = await AlertService.getCriticalAlerts(fiscalYear);

      res.status(200).json({
        status: 'success',
        data: {
          alerts,
          total: alerts.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending validations
   * GET /api/v1/dashboard/pending-validations
   */
  static async getPendingValidations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingValidations = await DashboardService.getPendingValidations();

      res.status(200).json({
        status: 'success',
        data: pendingValidations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complete dashboard data (all in one call)
   * GET /api/v1/dashboard
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : new Date().getFullYear();

      // Fetch all dashboard data in parallel
      const [stats, activities, trends, alertsSummary, workflowStats] = await Promise.all([
        DashboardService.getStats(fiscalYear),
        DashboardService.getRecentActivities(10),
        DashboardService.getBudgetTrends(fiscalYear, 6),
        AlertService.getAlertsSummary(fiscalYear),
        DashboardService.getWorkflowStats(),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          fiscalYear,
          stats,
          activities,
          trends,
          alerts: alertsSummary,
          workflow: workflowStats,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
