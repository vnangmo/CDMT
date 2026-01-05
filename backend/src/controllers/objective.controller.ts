import { Request, Response, NextFunction } from 'express';
import ObjectiveService from '../services/objective.service';

class ObjectiveController {
  /**
   * Get all objectives
   */
  async getObjectives(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        entityType: req.query.entityType as 'PROGRAM' | 'ACTION' | 'ACTIVITY' | undefined,
        programId: req.query.programId as string | undefined,
        actionId: req.query.actionId as string | undefined,
        activityId: req.query.activityId as string | undefined,
        objectiveType: req.query.objectiveType as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await ObjectiveService.getObjectives(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get objective by ID
   */
  async getObjectiveById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const objective = await ObjectiveService.getObjectiveById(id);
      res.json(objective);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create objective
   */
  async createObjective(req: Request, res: Response, next: NextFunction) {
    try {
      const objective = await ObjectiveService.createObjective(req.body);
      res.status(201).json(objective);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update objective
   */
  async updateObjective(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const objective = await ObjectiveService.updateObjective(id, req.body);
      res.json(objective);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete objective
   */
  async deleteObjective(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ObjectiveService.deleteObjective(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get objectives by Program ID
   */
  async getObjectivesByProgram(req: Request, res: Response, next: NextFunction) {
    try {
      const { programId } = req.params;
      const objectives = await ObjectiveService.getObjectivesByProgram(programId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get objectives by Action ID
   */
  async getObjectivesByAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { actionId } = req.params;
      const objectives = await ObjectiveService.getObjectivesByAction(actionId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get objectives by Activity ID
   */
  async getObjectivesByActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { activityId } = req.params;
      const objectives = await ObjectiveService.getObjectivesByActivity(activityId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get objective statistics
   */
  async getObjectiveStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ObjectiveService.getObjectiveStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new ObjectiveController();
