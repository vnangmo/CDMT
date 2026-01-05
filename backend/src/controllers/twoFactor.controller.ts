/**
 * Two-Factor Authentication (2FA) Controller
 * REQ-SEC-01: Authentification à deux facteurs (optionnelle)
 */

import { Request, Response, NextFunction } from 'express';
import { TwoFactorService } from '../services/twoFactor.service';
import { AuthService } from '../services/auth.service';

export class TwoFactorController {
  /**
   * GET /api/v1/auth/2fa/status
   * Get 2FA status for the authenticated user
   */
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const status = await TwoFactorService.getStatus(userId);

      res.status(200).json({
        status: 'success',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/generate
   * Generate a new 2FA secret (first step of enabling 2FA)
   */
  static async generateSecret(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const result = await TwoFactorService.generateSecret(userId);

      res.status(200).json({
        status: 'success',
        message: 'Secret 2FA généré. Scannez le QR code avec votre application d\'authentification.',
        data: {
          qrCodeUrl: result.qrCodeUrl,
          secret: result.secret, // Allow manual entry
          backupCodes: result.backupCodes,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/enable
   * Verify token and enable 2FA (second step)
   */
  static async enable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          status: 'error',
          message: 'Code 2FA requis',
        });
        return;
      }

      await TwoFactorService.verifyAndEnable(userId, token);

      res.status(200).json({
        status: 'success',
        message: 'Authentification à deux facteurs activée avec succès.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/disable
   * Disable 2FA (requires password confirmation)
   */
  static async disable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          status: 'error',
          message: 'Mot de passe requis pour désactiver la 2FA',
        });
        return;
      }

      await TwoFactorService.disable(userId, password);

      res.status(200).json({
        status: 'success',
        message: 'Authentification à deux facteurs désactivée.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/verify
   * Verify a 2FA token during login and return full tokens
   */
  static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        res.status(400).json({
          status: 'error',
          message: 'userId et token requis',
        });
        return;
      }

      // Verify the 2FA token
      const verifyResult = await TwoFactorService.verifyToken(userId, token);

      if (!verifyResult.verified) {
        res.status(401).json({
          status: 'error',
          message: 'Code 2FA invalide',
        });
        return;
      }

      // Complete the login and return tokens
      const loginResult = await AuthService.completeTwoFactorLogin(userId);

      res.status(200).json({
        status: 'success',
        message: verifyResult.usedBackupCode
          ? 'Connexion réussie (code de secours utilisé)'
          : 'Connexion réussie',
        data: {
          ...loginResult,
          usedBackupCode: verifyResult.usedBackupCode,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/backup-codes/regenerate
   * Regenerate backup codes (requires password)
   */
  static async regenerateBackupCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          status: 'error',
          message: 'Mot de passe requis pour régénérer les codes de secours',
        });
        return;
      }

      const backupCodes = await TwoFactorService.regenerateBackupCodes(userId, password);

      res.status(200).json({
        status: 'success',
        message: 'Codes de secours régénérés. Conservez-les en lieu sûr.',
        data: { backupCodes },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TwoFactorController;
