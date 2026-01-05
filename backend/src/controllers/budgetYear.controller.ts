import { Request, Response, NextFunction } from 'express';
import { BudgetYearService } from '../services/budgetYear.service';
import { BadRequestError } from '../middleware/errorHandler';

export class BudgetYearController {
  /**
   * Obtenir toutes les années budgétaires
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as 'DRAFT' | 'ACTIVE' | 'CLOSED' | undefined,
        isCurrent: req.query.isCurrent === 'true' ? true : req.query.isCurrent === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await BudgetYearService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une année budgétaire par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const budgetYear = await BudgetYearService.getById(id);

      res.status(200).json({
        status: 'success',
        data: budgetYear,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une année budgétaire par année
   */
  static async getByYear(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) {
        throw new BadRequestError('Année invalide');
      }
      const budgetYear = await BudgetYearService.getByYear(year);

      res.status(200).json({
        status: 'success',
        data: budgetYear,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir l'année budgétaire courante
   */
  static async getCurrentYear(req: Request, res: Response, next: NextFunction) {
    try {
      const currentYear = await BudgetYearService.getCurrentYear();

      res.status(200).json({
        status: 'success',
        data: currentYear,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une année budgétaire
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, label, startDate, endDate, status } = req.body;

      if (!year || !startDate || !endDate) {
        throw new BadRequestError('Champs requis manquants: year, startDate, endDate');
      }

      const budgetYear = await BudgetYearService.create({
        year: parseInt(year),
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      });

      res.status(201).json({
        status: 'success',
        message: 'Année budgétaire créée avec succès',
        data: budgetYear,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une année budgétaire
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { label, startDate, endDate, status, isCurrent } = req.body;

      const data: any = {};
      if (label !== undefined) data.label = label;
      if (startDate !== undefined) data.startDate = new Date(startDate);
      if (endDate !== undefined) data.endDate = new Date(endDate);
      if (status !== undefined) data.status = status;
      if (isCurrent !== undefined) data.isCurrent = isCurrent;

      const updated = await BudgetYearService.update(id, data);

      res.status(200).json({
        status: 'success',
        message: 'Année budgétaire mise à jour avec succès',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Définir une année comme année courante
   */
  static async setAsCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await BudgetYearService.setAsCurrent(id);

      res.status(200).json({
        status: 'success',
        message: 'Année budgétaire définie comme courante',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activer une année budgétaire (DRAFT -> ACTIVE)
   */
  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await BudgetYearService.activate(id);

      res.status(200).json({
        status: 'success',
        message: 'Année budgétaire activée avec succès',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clôturer une année budgétaire (ACTIVE -> CLOSED)
   */
  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await BudgetYearService.close(id);

      res.status(200).json({
        status: 'success',
        message: 'Année budgétaire clôturée avec succès',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une année budgétaire
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await BudgetYearService.delete(id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les statistiques
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await BudgetYearService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
