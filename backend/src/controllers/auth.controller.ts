import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { BadRequestError } from '../middleware/errorHandler';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Connexion utilisateur
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email et mot de passe requis');
      }

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        status: 'success',
        message: 'Connexion réussie',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/register
   * Inscription utilisateur
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, phone, roleId, ministryId } = req.body;

      if (!email || !password || !firstName || !lastName || !roleId) {
        throw new BadRequestError(
          'Email, mot de passe, prénom, nom et rôle sont requis'
        );
      }

      const user = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
        roleId,
        ministryId,
      });

      res.status(201).json({
        status: 'success',
        message: 'Utilisateur créé avec succès',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Rafraîchir le token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token requis');
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token rafraîchi avec succès',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Obtenir les informations de l'utilisateur connecté
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Utilisateur non authentifié');
      }

      const user = await AuthService.getMe(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   * Changer le mot de passe
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Utilisateur non authentifié');
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        throw new BadRequestError('Ancien et nouveau mot de passe requis');
      }

      if (newPassword.length < 8) {
        throw new BadRequestError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      }

      const result = await AuthService.changePassword(
        req.user.userId,
        oldPassword,
        newPassword
      );

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Déconnexion
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Utilisateur non authentifié');
      }

      const result = await AuthService.logout(req.user.userId);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
