import { Request, Response, NextFunction } from 'express';
import { FundingSourceService } from '../services/fundingSource.service';

export class FundingSourceController {
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

      const result = await FundingSourceService.getAll(filters);

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
      const source = await FundingSourceService.getById(id);

      res.status(200).json({
        status: 'success',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const source = await FundingSourceService.getByCode(code);

      res.status(200).json({
        status: 'success',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const source = await FundingSourceService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Source de financement créée avec succès',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await FundingSourceService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Source de financement mise à jour avec succès',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await FundingSourceService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Source de financement supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await FundingSourceService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Source de financement restaurée avec succès',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await FundingSourceService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
