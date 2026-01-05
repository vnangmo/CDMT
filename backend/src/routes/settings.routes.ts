import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All settings routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRoles(['ADMIN']));

/**
 * @route   GET /api/v1/settings
 * @desc    Get application settings
 * @access  Private - Admin only
 */
router.get('/', SettingsController.getSettings);

/**
 * @route   PUT /api/v1/settings
 * @desc    Update application settings
 * @access  Private - Admin only
 */
router.put('/', SettingsController.updateSettings);

/**
 * @route   GET /api/v1/settings/:key
 * @desc    Get specific setting by key
 * @access  Private - Admin only
 */
router.get('/:key', SettingsController.getSettingByKey);

/**
 * @route   PUT /api/v1/settings/:key
 * @desc    Update specific setting by key
 * @access  Private - Admin only
 */
router.put('/:key', SettingsController.updateSettingByKey);

export default router;
