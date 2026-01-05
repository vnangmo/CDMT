import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowHistoryService } from '../services/workflowHistory.service';

export class WorkflowController {
  /**
   * Get workflow history for a document
   */
  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, documentId } = req.params;

      const history = await WorkflowService.getHistory(documentType, documentId);

      res.json({
        status: 'success',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending reviews for current user
   */
  static async getPendingReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Non authentifié',
        });
        return;
      }

      const role = (req as any).user?.role?.name;
      const pendingReviews = await WorkflowService.getPendingReviews(userId, role);

      res.json({
        status: 'success',
        data: pendingReviews,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workflow statistics
   */
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, startDate, endDate } = req.query;

      const filters: any = {};

      if (documentType) {
        filters.documentType = documentType as string;
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const stats = await WorkflowService.getWorkflowStats(filters);

      res.json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if document can be edited
   */
  static async canEdit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, documentId } = req.params;

      const canEdit = await WorkflowService.canEdit(documentType, documentId);

      res.json({
        status: 'success',
        data: { canEdit },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if document is in final state
   */
  static async isFinal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, documentId } = req.params;

      const isFinal = await WorkflowService.isFinal(documentType, documentId);

      res.json({
        status: 'success',
        data: { isFinal },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WorkflowController;
