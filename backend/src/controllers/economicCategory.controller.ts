import { Request, Response, NextFunction } from 'express';
import { EconomicCategoryService } from '../services/economicCategory.service';

export class EconomicCategoryController {
  /**
   * Obtenir toutes les catégories économiques
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

      const result = await EconomicCategoryService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une catégorie économique par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await EconomicCategoryService.getById(id);

      res.status(200).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une catégorie économique par code
   */
  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const category = await EconomicCategoryService.getByCode(code);

      res.status(200).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir l'arborescence des catégories économiques
   */
  static async getTree(_req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await EconomicCategoryService.getTree();

      res.status(200).json({
        status: 'success',
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une catégorie économique
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await EconomicCategoryService.create(req.body);

      res.status(201).json({
        status: 'success',
        message: 'Catégorie économique créée avec succès',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une catégorie économique
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await EconomicCategoryService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Catégorie économique mise à jour avec succès',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une catégorie économique (soft delete)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await EconomicCategoryService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Catégorie économique désactivée avec succès',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restaurer une catégorie économique
   */
  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await EconomicCategoryService.restore(id);

      res.status(200).json({
        status: 'success',
        message: 'Catégorie économique restaurée avec succès',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les statistiques des catégories économiques
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await EconomicCategoryService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
