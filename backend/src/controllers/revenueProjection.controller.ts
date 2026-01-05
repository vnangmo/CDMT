import { Request, Response, NextFunction } from 'express';
import { RevenueProjectionService } from '../services/revenueProjection.service';

export class RevenueProjectionController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId, revenueType, isActive, page, limit } = req.query;

      const filters = {
        macroFrameworkId: macroFrameworkId as string | undefined,
        revenueType: revenueType as string | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await RevenueProjectionService.getAll(filters);

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
      const projection = await RevenueProjectionService.getById(id);

      res.status(200).json({
        status: 'success',
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByMacroFramework(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const projections = await RevenueProjectionService.getByMacroFramework(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: projections,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const projection = await RevenueProjectionService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Projection de recettes créée avec succès',
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const { projections } = req.body;

      const result = await RevenueProjectionService.createBulk(macroFrameworkId, projections);

      res.status(201).json({
        status: 'success',
        message: `${result.length} projections de recettes créées avec succès`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projection = await RevenueProjectionService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Projection de recettes mise à jour avec succès',
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await RevenueProjectionService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Projection de recettes supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async calculateProjection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projection = await RevenueProjectionService.calculateProjection(id);

      res.status(200).json({
        status: 'success',
        message: 'Projection recalculée avec succès',
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  static async recalculateAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const projections = await RevenueProjectionService.recalculateAll(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        message: `${projections.length} projections recalculées avec succès`,
        data: projections,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const summary = await RevenueProjectionService.getSummary(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}
