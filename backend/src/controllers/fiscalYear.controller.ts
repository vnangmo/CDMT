import { Request, Response, NextFunction } from 'express';
import { FiscalYearService } from '../services/fiscalYear.service';

export class FiscalYearController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, isClosed, search, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isClosed: isClosed === 'true' ? true : isClosed === 'false' ? false : undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await FiscalYearService.getAll(filters);

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
      const year = await FiscalYearService.getById(id);

      res.status(200).json({
        status: 'success',
        data: year,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByYear(req: Request, res: Response, next: NextFunction) {
    try {
      const { year } = req.params;
      const fiscalYear = await FiscalYearService.getByYear(parseInt(year, 10));

      res.status(200).json({
        status: 'success',
        data: fiscalYear,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const year = await FiscalYearService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Année fiscale créée avec succès',
        data: year,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const year = await FiscalYearService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Année fiscale mise à jour avec succès',
        data: year,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await FiscalYearService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Année fiscale supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const year = await FiscalYearService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Année fiscale restaurée avec succès',
        data: year,
      });
    } catch (error) {
      next(error);
    }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const year = await FiscalYearService.close(id);

      res.status(200).json({
        status: 'success',
        message: 'Année fiscale clôturée avec succès',
        data: year,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reopen(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const year = await FiscalYearService.reopen(id);

      res.status(200).json({
        status: 'success',
        message: 'Année fiscale rouverte avec succès',
        data: year,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await FiscalYearService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
