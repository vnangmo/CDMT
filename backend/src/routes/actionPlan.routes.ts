import express from 'express';
import ActionPlanController from '../controllers/actionPlan.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Action Plans CRUD
router.get('/', authorize(['ACTION_PLAN:READ']), ActionPlanController.getActionPlans);
router.get('/summary/ministry', authorize(['ACTION_PLAN:READ']), ActionPlanController.getSummaryByMinistry);
router.get('/:id', authorize(['ACTION_PLAN:READ']), ActionPlanController.getActionPlan);
router.post('/', authorize(['ACTION_PLAN:CREATE']), ActionPlanController.createActionPlan);
router.put('/:id', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.updateActionPlan);
router.delete('/:id', authorize(['ACTION_PLAN:DELETE']), ActionPlanController.deleteActionPlan);

// Plan operations
router.post('/:id/recalculate-costs', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.recalculatePlanCosts);
router.post('/:id/calculate-progress', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.calculateProgress);
router.post('/:id/validate', authorize(['ACTION_PLAN:VALIDATE']), ActionPlanController.validateActionPlan);
router.get('/:id/performance-indicators', authorize(['ACTION_PLAN:READ']), ActionPlanController.getPerformanceIndicators);
router.post('/:id/duplicate', authorize(['ACTION_PLAN:CREATE']), ActionPlanController.duplicateActionPlan);

// Activity routes
router.get('/:planId/activities', authorize(['ACTION_PLAN:READ']), ActionPlanController.getActivitiesByPlan);
router.get('/:planId/activities/summary', authorize(['ACTION_PLAN:READ']), ActionPlanController.getActivitiesSummaryByStatus);
router.get('/:planId/activities/critical-path', authorize(['ACTION_PLAN:READ']), ActionPlanController.calculateCriticalPath);
router.get('/activities/:activityId', authorize(['ACTION_PLAN:READ']), ActionPlanController.getActivity);
router.post('/:planId/activities', authorize(['ACTION_PLAN:CREATE']), ActionPlanController.createActivity);
router.put('/activities/:activityId', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.updateActivity);
router.delete('/activities/:activityId', authorize(['ACTION_PLAN:DELETE']), ActionPlanController.deleteActivity);

// Activity operations
router.post('/:planId/activities/reorder', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.reorderActivities);
router.post('/:planId/activities/bulk-import', authorize(['ACTION_PLAN:CREATE']), ActionPlanController.bulkImportActivities);
router.post('/activities/:activityId/start', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.startActivity);
router.post('/activities/:activityId/complete', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.completeActivity);
router.post('/activities/:activityId/progress', authorize(['ACTION_PLAN:UPDATE']), ActionPlanController.updateProgress);

// Export
router.get('/:id/export/pdf', authorize(['ACTION_PLAN:READ']), ActionPlanController.exportPdf);
router.get('/:id/export/excel', authorize(['ACTION_PLAN:READ']), ActionPlanController.exportExcel);
router.get('/:id/export/csv', authorize(['ACTION_PLAN:READ']), ActionPlanController.exportCsv);

export default router;
