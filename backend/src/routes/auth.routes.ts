import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
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

export default router;
