import { Request, Response, NextFunction } from 'express';
import { EconomicNatureService } from '../services/economicNature.service';

export class EconomicNatureController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, type, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        type: type as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await EconomicNatureService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const nature = await EconomicNatureService.getById(id);

      res.status(200).json({
        status: 'success',
        data: nature,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const nature = await EconomicNatureService.getByCode(code);

      res.status(200).json({
        status: 'success',
        data: nature,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const nature = await EconomicNatureService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Nature économique créée avec succès',
        data: nature,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const nature = await EconomicNatureService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Nature économique mise à jour avec succès',
        data: nature,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await EconomicNatureService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Nature économique supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const nature = await EconomicNatureService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Nature économique restaurée avec succès',
        data: nature,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await EconomicNatureService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
