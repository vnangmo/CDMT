import { Request, Response, NextFunction } from 'express';
import { ExpenseProjectionService } from '../services/expenseProjection.service';

export class ExpenseProjectionController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId, expenseType, ministryId, isActive, page, limit } = req.query;

      const filters = {
        macroFrameworkId: macroFrameworkId as string | undefined,
        expenseType: expenseType as string | undefined,
        ministryId: ministryId as string | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await ExpenseProjectionService.getAll(filters);

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
      const projection = await ExpenseProjectionService.getById(id);

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
      const projections = await ExpenseProjectionService.getByMacroFramework(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: projections,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId, ministryId } = req.params;
      const projections = await ExpenseProjectionService.getByMinistry(
        macroFrameworkId,
        ministryId
      );

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
      const projection = await ExpenseProjectionService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Projection de dépenses créée avec succès',
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

      const result = await ExpenseProjectionService.createBulk(macroFrameworkId, projections);

      res.status(201).json({
        status: 'success',
        message: `${result.length} projections de dépenses créées avec succès`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projection = await ExpenseProjectionService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Projection de dépenses mise à jour avec succès',
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ExpenseProjectionService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Projection de dépenses supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async calculateProjection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projection = await ExpenseProjectionService.calculateProjection(id);

      res.status(200).json({
        status: 'success',
        message: 'Projection recalculée avec succès',
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const summary = await ExpenseProjectionService.getSummary(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFiscalBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const balance = await ExpenseProjectionService.getFiscalBalance(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }
}
