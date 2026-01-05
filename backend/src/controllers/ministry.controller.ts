import { Request, Response, NextFunction } from 'express';
import { MinistryService } from '../services/ministry.service';

export class MinistryController {
  /**
   * Obtenir tous les ministères
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, isPriority, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isPriority: isPriority === 'true' ? true : isPriority === 'false' ? false : undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await MinistryService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un ministère par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ministry = await MinistryService.getById(id);

      res.status(200).json({
        status: 'success',
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un ministère par code
   */
  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const ministry = await MinistryService.getByCode(code);

      res.status(200).json({
        status: 'success',
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un ministère
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ministry = await MinistryService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Ministère créé avec succès',
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un ministère
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ministry = await MinistryService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Ministère mis à jour avec succès',
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un ministère (soft delete)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ministry = await MinistryService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Ministère désactivé avec succès',
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restaurer un ministère
   */
  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ministry = await MinistryService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Ministère restauré avec succès',
        data: ministry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les statistiques des ministères
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await MinistryService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
