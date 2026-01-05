import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All role routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/roles/statistics
 * @desc    Get role statistics
 * @access  Private - Admin
 */
router.get('/statistics', authorizeRoles(['ADMIN_SYSTEM']), RoleController.getStatistics);

/**
 * @route   GET /api/v1/roles/access-matrix
 * @desc    Get access matrix (roles vs permissions)
 * @access  Private - Admin
 */
router.get('/access-matrix', authorizeRoles(['ADMIN_SYSTEM']), RoleController.getAccessMatrix);

/**
 * @route   GET /api/v1/roles/permissions/all
 * @desc    Get all permissions
 * @access  Private - Admin
 */
router.get('/permissions/all', authorizeRoles(['ADMIN_SYSTEM']), RoleController.getAllPermissions);

/**
 * @route   GET /api/v1/roles/permissions/by-module
 * @desc    Get permissions grouped by module
 * @access  Private - Admin
 */
router.get('/permissions/by-module', authorizeRoles(['ADMIN_SYSTEM']), RoleController.getPermissionsByModule);

/**
 * @route   GET /api/v1/roles
 * @desc    Get all roles
 * @access  Private - Admin, DIR_BUDGET
 */
router.get('/', authorizeRoles(['ADMIN_SYSTEM', 'DIR_BUDGET']), RoleController.getAll);

/**
 * @route   GET /api/v1/roles/code/:code
 * @desc    Get role by code
 * @access  Private - Admin
 */
router.get('/code/:code', authorizeRoles(['ADMIN_SYSTEM']), RoleController.getByCode);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID
 * @access  Private - Admin
 */
router.get('/:id', authorizeRoles(['ADMIN_SYSTEM']), RoleController.getById);

/**
 * @route   POST /api/v1/roles
 * @desc    Create a new role
 * @access  Private - Admin
 */
router.post('/', authorizeRoles(['ADMIN_SYSTEM']), RoleController.create);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Update a role
 * @access  Private - Admin
 */
router.put('/:id', authorizeRoles(['ADMIN_SYSTEM']), RoleController.update);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Delete a role
 * @access  Private - Admin
 */
router.delete('/:id', authorizeRoles(['ADMIN_SYSTEM']), RoleController.delete);

/**
 * @route   POST /api/v1/roles/:id/permissions
 * @desc    Assign permissions to a role
 * @access  Private - Admin
 */
router.post('/:id/permissions', authorizeRoles(['ADMIN_SYSTEM']), RoleController.assignPermissions);

/**
 * @route   DELETE /api/v1/roles/:id/permissions
 * @desc    Remove permissions from a role
 * @access  Private - Admin
 */
router.delete('/:id/permissions', authorizeRoles(['ADMIN_SYSTEM']), RoleController.removePermissions);

export default router;
