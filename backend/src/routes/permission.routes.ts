import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All permission routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/permissions/by-module
 * @desc    Get permissions grouped by module
 * @access  Private - Admin, DIR_BUDGET
 */
router.get('/by-module', authorizeRoles(['ADMIN_SYSTEM', 'DIR_BUDGET']), PermissionController.getByModule);

/**
 * @route   GET /api/v1/permissions
 * @desc    Get all permissions
 * @access  Private - Admin, DIR_BUDGET
 */
router.get('/', authorizeRoles(['ADMIN_SYSTEM', 'DIR_BUDGET']), PermissionController.getAll);

/**
 * @route   GET /api/v1/permissions/:id
 * @desc    Get permission by ID
 * @access  Private - Admin
 */
router.get('/:id', authorizeRoles(['ADMIN_SYSTEM']), PermissionController.getById);

export default router;
