import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', UserController.getProfile);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', UserController.updateProfile);

/**
 * @route   PUT /api/v1/users/me/avatar
 * @desc    Update user avatar/photo
 * @access  Private
 */
router.put('/me/avatar', UserController.updateAvatar);

/**
 * @route   GET /api/v1/users/me/settings
 * @desc    Get user settings (preferences)
 * @access  Private
 */
router.get('/me/settings', UserController.getSettings);

/**
 * @route   PUT /api/v1/users/me/settings
 * @desc    Update user settings (preferences)
 * @access  Private
 */
router.put('/me/settings', UserController.updateSettings);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Admin only)
 * @access  Private - Admin
 */
router.get('/', authorizeRoles(['ADMIN']), UserController.getAll);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private - Admin
 */
router.get('/:id', authorizeRoles(['ADMIN']), UserController.getById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (Admin only)
 * @access  Private - Admin
 */
router.put('/:id', authorizeRoles(['ADMIN']), UserController.update);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private - Admin
 */
router.delete('/:id', authorizeRoles(['ADMIN']), UserController.delete);

/**
 * @route   POST /api/v1/users/:id/activate
 * @desc    Activate user (Admin only)
 * @access  Private - Admin
 */
router.post('/:id/activate', authorizeRoles(['ADMIN']), UserController.activate);

/**
 * @route   POST /api/v1/users/:id/deactivate
 * @desc    Deactivate user (Admin only)
 * @access  Private - Admin
 */
router.post('/:id/deactivate', authorizeRoles(['ADMIN']), UserController.deactivate);

export default router;
