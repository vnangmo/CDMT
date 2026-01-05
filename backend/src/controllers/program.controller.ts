import { Request, Response, NextFunction } from 'express';
import { ProgramService } from '../services/program.service';

export class ProgramController {
  // ==================== PROGRAMMES ====================

  /**
   * Obtenir tous les programmes
   */
  static async getAllPrograms(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, ministryId, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        ministryId: ministryId as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await ProgramService.getAllPrograms(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un programme par ID
   */
  static async getProgramById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const program = await ProgramService.getProgramById(id);

      res.status(200).json({
        status: 'success',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un programme
   */
  static async createProgram(req: Request, res: Response, next: NextFunction) {
    try {
      const program = await ProgramService.createProgram(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Programme créé avec succès',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un programme
   */
  static async updateProgram(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const program = await ProgramService.updateProgram(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Programme mis à jour avec succès',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un programme (soft delete)
   */
  static async deleteProgram(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const program = await ProgramService.deleteProgram(id);

      res.status(200).json({
        status: 'success',
        message: 'Programme désactivé avec succès',
        data: program,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ACTIONS ====================

  /**
   * Obtenir toutes les actions
   */
  static async getAllActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, programId, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        programId: programId as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await ProgramService.getAllActions(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une action par ID
   */
  static async getActionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const action = await ProgramService.getActionById(id);

      res.status(200).json({
        status: 'success',
        data: action,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une action
   */
  static async createAction(req: Request, res: Response, next: NextFunction) {
    try {
      const action = await ProgramService.createAction(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Action créée avec succès',
        data: action,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une action
   */
  static async updateAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const action = await ProgramService.updateAction(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Action mise à jour avec succès',
        data: action,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une action (soft delete)
   */
  static async deleteAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const action = await ProgramService.deleteAction(id);

      res.status(200).json({
        status: 'success',
        message: 'Action désactivée avec succès',
        data: action,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ACTIVITÉS ====================

  /**
   * Obtenir toutes les activités
   */
  static async getAllActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, actionId, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        actionId: actionId as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await ProgramService.getAllActivities(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une activité par ID
   */
  static async getActivityById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const activity = await ProgramService.getActivityById(id);

      res.status(200).json({
        status: 'success',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une activité
   */
  static async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const activity = await ProgramService.createActivity(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Activité créée avec succès',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une activité
   */
  static async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const activity = await ProgramService.updateActivity(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Activité mise à jour avec succès',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une activité (soft delete)
   */
  static async deleteActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const activity = await ProgramService.deleteActivity(id);

      res.status(200).json({
        status: 'success',
        message: 'Activité désactivée avec succès',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATISTIQUES ====================

  /**
   * Obtenir les statistiques de la structure programmatique
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ProgramService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
