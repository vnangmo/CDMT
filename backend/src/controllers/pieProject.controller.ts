import { Request, Response, NextFunction } from 'express';
import { PIEProjectService } from '../services/pieProject.service';

export class PIEProjectController {
  /**
   * Get all PIE projects
   */
  static async getPIEProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        ministryId: req.query.ministryId as string | undefined,
        programId: req.query.programId as string | undefined,
        actionId: req.query.actionId as string | undefined,
        activityId: req.query.activityId as string | undefined,
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
        fiscalYear: req.query.fiscalYear ? parseInt(req.query.fiscalYear as string) : undefined,
      };

      const projects = await PIEProjectService.getPIEProjects(filters);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PIE project by ID
   */
  static async getPIEProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await PIEProjectService.getPIEProject(id);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create PIE project
   */
  static async createPIEProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await PIEProjectService.createPIEProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update PIE project
   */
  static async updatePIEProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await PIEProjectService.updatePIEProject(id, req.body);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete PIE project
   */
  static async deletePIEProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await PIEProjectService.deletePIEProject(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PIE projects summary by ministry
   */
  static async getSummaryByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await PIEProjectService.getSummaryByMinistry(fiscalYear);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PIE projects summary by category
   */
  static async getSummaryByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await PIEProjectService.getSummaryByCategory();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate PIE projects
   */
  static async validateProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = await PIEProjectService.validateProjects();
      res.json(validation);
    } catch (error) {
      next(error);
    }
  }
}

export default PIEProjectController;
