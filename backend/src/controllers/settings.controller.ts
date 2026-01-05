import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';
import { NotFoundError } from '../middleware/errorHandler';

export class SettingsController {
  /**
   * GET /api/v1/settings
   * Get all application settings
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getAll();

      res.status(200).json({
        status: 'success',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/settings
   * Update application settings
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settingsData = req.body;
      const userId = req.user?.userId;
      const settings = await SettingsService.update(settingsData, userId);

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
   * GET /api/v1/settings/:key
   * Get specific setting by key
   */
  static async getSettingByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const value = await SettingsService.getByKey(key);

      if (value === null) {
        throw new NotFoundError(`Paramètre '${key}' non trouvé`);
      }

      res.status(200).json({
        status: 'success',
        data: { key, value },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/settings/:key
   * Update specific setting by key
   */
  static async updateSettingByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const userId = req.user?.userId;

      const updated = await SettingsService.updateByKey(key, value, userId);

      res.status(200).json({
        status: 'success',
        message: `Paramètre '${key}' mis à jour avec succès`,
        data: { key, value: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}
