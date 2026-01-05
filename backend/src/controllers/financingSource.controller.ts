import { Request, Response, NextFunction } from 'express';
import { FinancingSourceService } from '../services/financingSource.service';

export class FinancingSourceController {
  /**
   * Obtenir toutes les sources de financement
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, type, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        type: type as 'INTERNAL' | 'EXTERNAL' | 'MIXED' | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await FinancingSourceService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une source de financement par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await FinancingSourceService.getById(id);

      res.status(200).json({
        status: 'success',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une source de financement par code
   */
  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const source = await FinancingSourceService.getByCode(code);

      res.status(200).json({
        status: 'success',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une source de financement
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const source = await FinancingSourceService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Source de financement créée avec succès',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une source de financement
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await FinancingSourceService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Source de financement mise à jour avec succès',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une source de financement (soft delete)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await FinancingSourceService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Source de financement désactivée avec succès',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restaurer une source de financement
   */
  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await FinancingSourceService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Source de financement restaurée avec succès',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les statistiques des sources de financement
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await FinancingSourceService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
