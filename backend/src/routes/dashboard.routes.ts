import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/dashboard
 * @desc Get complete dashboard data (all in one call)
 * @access Private
 */
router.get('/', DashboardController.getDashboard);

/**
 * @route GET /api/v1/dashboard/stats
 * @desc Get main dashboard statistics
 * @access Private
 * @query fiscalYear - Optional fiscal year filter
 */
router.get('/stats', DashboardController.getStats);

/**
 * @route GET /api/v1/dashboard/activities
 * @desc Get recent activities
 * @access Private
 * @query limit - Number of activities to return (default: 20)
 */
router.get('/activities', DashboardController.getRecentActivities);

/**
 * @route GET /api/v1/dashboard/trends
 * @desc Get budget trends over time
 * @access Private
 * @query fiscalYear - Fiscal year (default: current year)
 * @query months - Number of months to include (default: 12)
 */
router.get('/trends', DashboardController.getBudgetTrends);

/**
 * @route GET /api/v1/dashboard/ministries
 * @desc Get ministry comparison data
 * @access Private
 * @query fiscalYear - Fiscal year (default: current year)
 */
router.get('/ministries', DashboardController.getMinistryComparison);

/**
 * @route GET /api/v1/dashboard/workflow-stats
 * @desc Get workflow statistics
 * @access Private
 */
router.get('/workflow-stats', DashboardController.getWorkflowStats);

/**
 * @route GET /api/v1/dashboard/pending-validations
 * @desc Get pending validations summary
 * @access Private
 */
router.get('/pending-validations', DashboardController.getPendingValidations);

/**
 * @route GET /api/v1/dashboard/alerts
 * @desc Get all alerts
 * @access Private
 * @query fiscalYear - Optional fiscal year filter
 * @query type - Alert type filter
 * @query severity - Alert severity filter
 * @query ministryId - Ministry filter
 */
router.get('/alerts', DashboardController.getAlerts);

/**
 * @route GET /api/v1/dashboard/alerts/summary
 * @desc Get alerts summary (counts by type and severity)
 * @access Private
 * @query fiscalYear - Optional fiscal year filter
 */
router.get('/alerts/summary', DashboardController.getAlertsSummary);

/**
 * @route GET /api/v1/dashboard/alerts/critical
 * @desc Get critical alerts only
 * @access Private
 * @query fiscalYear - Optional fiscal year filter
 */
router.get('/alerts/critical', DashboardController.getCriticalAlerts);

export default router;
