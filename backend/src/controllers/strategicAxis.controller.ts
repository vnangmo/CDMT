import { Request, Response, NextFunction } from 'express';
import { StrategicAxisService } from '../services/strategicAxis.service';

export class StrategicAxisController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await StrategicAxisService.getAll(filters);

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
      const axis = await StrategicAxisService.getById(id);

      res.status(200).json({
        status: 'success',
        data: axis,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const axis = await StrategicAxisService.getByCode(code);

      res.status(200).json({
        status: 'success',
        data: axis,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const axis = await StrategicAxisService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Axe stratégique créé avec succès',
        data: axis,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const axis = await StrategicAxisService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Axe stratégique mis à jour avec succès',
        data: axis,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await StrategicAxisService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Axe stratégique supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const axis = await StrategicAxisService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Axe stratégique restauré avec succès',
        data: axis,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await StrategicAxisService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
