import { Router } from 'express';
import ObjectiveController from '../controllers/objective.controller';
import { authenticate, authorize, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/objectives
 * @desc    Get all objectives with filters
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  ObjectiveController.getObjectives
);

/**
 * @route   GET /api/v1/objectives/stats
 * @desc    Get objective statistics
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/stats',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  ObjectiveController.getObjectiveStats
);

/**
 * @route   GET /api/v1/objectives/program/:programId
 * @desc    Get objectives by Program ID
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/program/:programId',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  ObjectiveController.getObjectivesByProgram
);

/**
 * @route   GET /api/v1/objectives/action/:actionId
 * @desc    Get objectives by Action ID
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/action/:actionId',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  ObjectiveController.getObjectivesByAction
);

/**
 * @route   GET /api/v1/objectives/activity/:activityId
 * @desc    Get objectives by Activity ID
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/activity/:activityId',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  ObjectiveController.getObjectivesByActivity
);

/**
 * @route   GET /api/v1/objectives/:id
 * @desc    Get objective by ID
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/:id',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  ObjectiveController.getObjectiveById
);

/**
 * @route   POST /api/v1/objectives
 * @desc    Create new objective
 * @access  Private (PROGRAMMATIC_STRUCTURE:CREATE)
 */
router.post(
  '/',
  authorize(['PROGRAMMATIC_STRUCTURE:CREATE']),
  ObjectiveController.createObjective
);

/**
 * @route   PUT /api/v1/objectives/:id
 * @desc    Update objective
 * @access  Private (PROGRAMMATIC_STRUCTURE:UPDATE)
 */
router.put(
  '/:id',
  authorize(['PROGRAMMATIC_STRUCTURE:UPDATE']),
  ObjectiveController.updateObjective
);

/**
 * @route   DELETE /api/v1/objectives/:id
 * @desc    Delete objective
 * @access  Private (PROGRAMMATIC_STRUCTURE:DELETE)
 */
router.delete(
  '/:id',
  authorize(['PROGRAMMATIC_STRUCTURE:DELETE']),
  ObjectiveController.deleteObjective
);

export default router;
