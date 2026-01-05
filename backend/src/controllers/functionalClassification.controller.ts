import { Request, Response, NextFunction } from 'express';
import { FunctionalClassificationService } from '../services/functionalClassification.service';

export class FunctionalClassificationController {
  /**
   * Obtenir toutes les classifications fonctionnelles
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, search, parentId, page, limit } = req.query;

      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string | undefined,
        parentId: parentId === 'null' ? null : (parentId as string | undefined),
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await FunctionalClassificationService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une classification fonctionnelle par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const classification = await FunctionalClassificationService.getById(id);

      res.status(200).json({
        status: 'success',
        data: classification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une classification fonctionnelle par code
   */
  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const classification = await FunctionalClassificationService.getByCode(code);

      res.status(200).json({
        status: 'success',
        data: classification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir l'arborescence des classifications fonctionnelles
   */
  static async getTree(_req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await FunctionalClassificationService.getTree();

      res.status(200).json({
        status: 'success',
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une classification fonctionnelle
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const classification = await FunctionalClassificationService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Classification fonctionnelle créée avec succès',
        data: classification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une classification fonctionnelle
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const classification = await FunctionalClassificationService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Classification fonctionnelle mise à jour avec succès',
        data: classification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une classification fonctionnelle (soft delete)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const classification = await FunctionalClassificationService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Classification fonctionnelle désactivée avec succès',
        data: classification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restaurer une classification fonctionnelle
   */
  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const classification = await FunctionalClassificationService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Classification fonctionnelle restaurée avec succès',
        data: classification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les statistiques des classifications fonctionnelles
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await FunctionalClassificationService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
