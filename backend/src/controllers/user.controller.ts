import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';

export class UserController {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId; // From auth middleware
      const user = await UserService.getProfile(userId);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me
   * Update current user profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { firstName, lastName, phone } = req.body;

      const user = await UserService.updateProfile(userId, {
        firstName,
        lastName,
        phone,
      });

      res.status(200).json({
        status: 'success',
        message: 'Profil mis à jour avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me/avatar
   * Update user avatar
   */
  static async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { avatar } = req.body; // Base64 ou URL

      const user = await UserService.updateAvatar(userId, avatar);

      res.status(200).json({
        status: 'success',
        message: 'Avatar mis à jour avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me/settings
   * Get user settings/preferences
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const settings = await UserService.getSettings(userId);

      res.status(200).json({
        status: 'success',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me/settings
   * Update user settings/preferences
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const settingsData = req.body;

      const settings = await UserService.updateSettings(userId, settingsData);

      res.status(200).json({
        status: 'success',
        message: 'Paramètres mis à jour avec succès',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users
   * Get all users (Admin only)
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50, search, roleId, ministryId, isActive } = req.query;

      const result = await UserService.getAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        roleId: roleId as string,
        ministryId: ministryId as string,
        isActive: isActive === 'true',
      });

      res.status(200).json({
        status: 'success',
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Get user by ID (Admin only)
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getById(id);

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/:id
   * Update user (Admin only)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await UserService.update(id, updateData);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur mis à jour avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Delete user (Admin only)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/:id/activate
   * Activate user (Admin only)
   */
  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.setActive(id, true);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur activé avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/:id/deactivate
   * Deactivate user (Admin only)
   */
  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.setActive(id, false);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur désactivé avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
