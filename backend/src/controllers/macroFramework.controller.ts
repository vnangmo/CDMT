import { Request, Response, NextFunction } from 'express';
import { MacroFrameworkService } from '../services/macroFramework.service';
import { MacroCalculationService } from '../services/macroCalculation.service';

export class MacroFrameworkController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, budgetYear, status, page, limit } = req.query;

      const filters = {
        year: year ? parseInt(year as string, 10) : undefined,
        budgetYear: budgetYear ? parseInt(budgetYear as string, 10) : undefined,
        status: status as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await MacroFrameworkService.getAll(filters);

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
      const framework = await MacroFrameworkService.getById(id);

      res.status(200).json({
        status: 'success',
        data: framework,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByYear(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, budgetYear } = req.params;
      const framework = await MacroFrameworkService.getByYear(
        parseInt(year, 10),
        parseInt(budgetYear, 10)
      );

      res.status(200).json({
        status: 'success',
        data: framework,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const framework = await MacroFrameworkService.create(req.body, userId);

      res.status(201).json({
        status: 'success',
        message: 'Cadre macroéconomique créé avec succès',
        data: framework,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const framework = await MacroFrameworkService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Cadre macroéconomique mis à jour avec succès',
        data: framework,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await MacroFrameworkService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Cadre macroéconomique supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const framework = await MacroFrameworkService.validate(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Cadre macroéconomique validé avec succès',
        data: framework,
      });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const framework = await MacroFrameworkService.approve(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Cadre macroéconomique approuvé avec succès',
        data: framework,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const framework = await MacroFrameworkService.reject(id);

      res.status(200).json({
        status: 'success',
        message: 'Cadre macroéconomique rejeté avec succès',
        data: framework,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await MacroFrameworkService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateCoherence(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validation = await MacroCalculationService.validateCoherence(id);

      res.status(200).json({
        status: 'success',
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGlobalStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const stats = await MacroCalculationService.calculateGlobalStats(id);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
