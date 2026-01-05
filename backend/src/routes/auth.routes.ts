import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { TwoFactorController } from '../controllers/twoFactor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import {
  validateLogin,
  validateRegister,
  validateChangePassword,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 * @limit   5 attempts per 15 minutes
 */
router.post('/login', authLimiter, validateLogin, AuthController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Inscription utilisateur
 * @access  Public (ou protégé selon la politique)
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rafraîchir le token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getMe);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.post('/change-password', authenticate, validateChangePassword, AuthController.changePassword);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Déconnexion
 * @access  Private
 */
router.post('/logout', authenticate, AuthController.logout);

// ==================== Two-Factor Authentication (2FA) Routes ====================
// REQ-SEC-01: Authentification à deux facteurs (optionnelle)

/**
 * @route   GET /api/v1/auth/2fa/status
 * @desc    Get 2FA status for the authenticated user
 * @access  Private
 */
router.get('/2fa/status', authenticate, TwoFactorController.getStatus);

/**
 * @route   POST /api/v1/auth/2fa/generate
 * @desc    Generate a new 2FA secret (step 1 of enabling)
 * @access  Private
 */
router.post('/2fa/generate', authenticate, TwoFactorController.generateSecret);

/**
 * @route   POST /api/v1/auth/2fa/enable
 * @desc    Verify token and enable 2FA (step 2)
 * @access  Private
 */
router.post('/2fa/enable', authenticate, TwoFactorController.enable);

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable 2FA (requires password)
 * @access  Private
 */
router.post('/2fa/disable', authenticate, TwoFactorController.disable);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify a 2FA token during login
 * @access  Public (used after initial login)
 */
router.post('/2fa/verify', authLimiter, TwoFactorController.verify);

/**
 * @route   POST /api/v1/auth/2fa/backup-codes/regenerate
 * @desc    Regenerate backup codes (requires password)
 * @access  Private
 */
router.post('/2fa/backup-codes/regenerate', authenticate, TwoFactorController.regenerateBackupCodes);

export default router;
