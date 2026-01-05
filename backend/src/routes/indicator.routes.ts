import { Router } from 'express';
import IndicatorController from '../controllers/indicator.controller';
import { authenticate, authorize, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/indicators
 * @desc    Get all indicators with filters
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  IndicatorController.getIndicators
);

/**
 * @route   GET /api/v1/indicators/stats
 * @desc    Get indicator statistics
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/stats',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  IndicatorController.getIndicatorStats
);

/**
 * @route   GET /api/v1/indicators/objective/:objectiveId
 * @desc    Get indicators by Objective ID
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/objective/:objectiveId',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  IndicatorController.getIndicatorsByObjective
);

/**
 * @route   GET /api/v1/indicators/:id/performance
 * @desc    Get indicator performance (targets vs actuals)
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/:id/performance',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  IndicatorController.getIndicatorPerformance
);

/**
 * @route   GET /api/v1/indicators/:id
 * @desc    Get indicator by ID
 * @access  Private (PROGRAMMATIC_STRUCTURE:READ)
 */
router.get(
  '/:id',
  authorize(['PROGRAMMATIC_STRUCTURE:READ']),
  IndicatorController.getIndicatorById
);

/**
 * @route   POST /api/v1/indicators
 * @desc    Create new indicator
 * @access  Private (PROGRAMMATIC_STRUCTURE:CREATE)
 */
router.post(
  '/',
  authorize(['PROGRAMMATIC_STRUCTURE:CREATE']),
  IndicatorController.createIndicator
);

/**
 * @route   PUT /api/v1/indicators/:id
 * @desc    Update indicator
 * @access  Private (PROGRAMMATIC_STRUCTURE:UPDATE)
 */
router.put(
  '/:id',
  authorize(['PROGRAMMATIC_STRUCTURE:UPDATE']),
  IndicatorController.updateIndicator
);

/**
 * @route   PUT /api/v1/indicators/:id/actual-values
 * @desc    Update actual values for an indicator
 * @access  Private (PROGRAMMATIC_STRUCTURE:UPDATE)
 */
router.put(
  '/:id/actual-values',
  authorize(['PROGRAMMATIC_STRUCTURE:UPDATE']),
  IndicatorController.updateActualValues
);

/**
 * @route   DELETE /api/v1/indicators/:id
 * @desc    Delete indicator
 * @access  Private (PROGRAMMATIC_STRUCTURE:DELETE)
 */
router.delete(
  '/:id',
  authorize(['PROGRAMMATIC_STRUCTURE:DELETE']),
  IndicatorController.deleteIndicator
);

export default router;
