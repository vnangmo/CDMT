import { Request, Response, NextFunction } from 'express';
import { PIPProjectService } from '../services/pipProject.service';

export class PIPProjectController {
  /**
   * Get all PIP projects
   */
  static async getPIPProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        ministryId: req.query.ministryId as string | undefined,
        programId: req.query.programId as string | undefined,
        actionId: req.query.actionId as string | undefined,
        activityId: req.query.activityId as string | undefined,
        fundingSourceId: req.query.fundingSourceId as string | undefined,
        category: req.query.category as string | undefined,
        projectType: req.query.projectType as string | undefined,
        status: req.query.status as string | undefined,
        isRecurrent: req.query.isRecurrent === 'true' ? true : req.query.isRecurrent === 'false' ? false : undefined,
        fiscalYear: req.query.fiscalYear ? parseInt(req.query.fiscalYear as string) : undefined,
      };

      const projects = await PIPProjectService.getPIPProjects(filters);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PIP project by ID
   */
  static async getPIPProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await PIPProjectService.getPIPProject(id);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create PIP project
   */
  static async createPIPProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await PIPProjectService.createPIPProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update PIP project
   */
  static async updatePIPProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await PIPProjectService.updatePIPProject(id, req.body);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete PIP project
   */
  static async deletePIPProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await PIPProjectService.deletePIPProject(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PIP projects summary by ministry
   */
  static async getSummaryByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await PIPProjectService.getSummaryByMinistry(fiscalYear);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get PIP projects summary by funding source
   */
  static async getSummaryByFundingSource(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await PIPProjectService.getSummaryByFundingSource();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recurrent PIP projects
   */
  static async getRecurrentProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await PIPProjectService.getRecurrentProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get externally funded PIP projects
   */
  static async getExternallyFundedProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await PIPProjectService.getExternallyFundedProjects();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate PIP projects
   */
  static async validateProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = await PIPProjectService.validateProjects();
      res.json(validation);
    } catch (error) {
      next(error);
    }
  }
}

export default PIPProjectController;
