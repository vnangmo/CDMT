import express from 'express';
import SectoralMeasureController from '../controllers/sectoralMeasure.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Sectoral Measures - List and Create
router.get('/', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getSectoralMeasures);
router.post('/', authorize(['SECTORAL_MEASURE:CREATE']), SectoralMeasureController.createSectoralMeasure);

// Summary routes (must be before /:id to avoid matching)
router.get('/summary/ministry', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getSummaryByMinistry);
router.get('/summary/category', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getSummaryByCategory);
router.get('/summary/action', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getSummaryByAction);
router.get('/summary/activity', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getSummaryByActivity);

// Validation routes (must be before /:id to avoid matching)
router.get('/validate-all-ceilings', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.checkAllMinisteryCeilings);

// Ministry-specific routes (must be before /:id to avoid matching)
router.get('/ministry/:ministryId/aggregated-costs', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getMinistryAggregatedCosts);
router.get('/ministry/:ministryId/breakdown/economic-nature', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getCostBreakdownByEconomicNature);
router.get('/ministry/:ministryId/breakdown/funding-source', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getCostBreakdownByFundingSource);
router.get('/ministry/:ministryId/cost-report', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getComprehensiveCostReport);
router.get('/ministry/:ministryId/validate-ceiling', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.validateMinisteryCeiling);
router.get('/ministry/:ministryId/available-margin', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.calculateAvailableMargin);
router.get('/ministry/:ministryId/validation-report', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.generateValidationReport);
router.get('/ministry/:ministryId/integration-status', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getIntegrationStatus);
router.get('/ministry/:ministryId/preview-integration', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.previewIntegration);
router.post('/ministry/:ministryId/integrate', authorize(['SECTORAL_MEASURE:INTEGRATE']), SectoralMeasureController.integrateMinistryMeasures);
router.post('/ministry/:ministryId/rollback', authorize(['SECTORAL_MEASURE:INTEGRATE']), SectoralMeasureController.rollbackIntegration);

// Integration all (must be before /:id to avoid matching)
router.post('/integrate-all', authorize(['SECTORAL_MEASURE:INTEGRATE']), SectoralMeasureController.integrateAllMinistries);

// Individual measure by ID (must be after all specific routes)
router.get('/:id', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.getSectoralMeasure);
router.put('/:id', authorize(['SECTORAL_MEASURE:UPDATE']), SectoralMeasureController.updateSectoralMeasure);
router.delete('/:id', authorize(['SECTORAL_MEASURE:DELETE']), SectoralMeasureController.deleteSectoralMeasure);

// Workflow (5-Level Workflow) - /:id prefix routes
router.post('/:id/submit', authorize(['SECTORAL_MEASURE:UPDATE']), SectoralMeasureController.submit);
router.post('/:id/start-review', authorize(['SECTORAL_MEASURE:REVIEW']), SectoralMeasureController.startReview);
router.post('/:id/validate', authorize(['SECTORAL_MEASURE:VALIDATE']), SectoralMeasureController.validate);
router.post('/:id/approve', authorize(['SECTORAL_MEASURE:APPROVE']), SectoralMeasureController.approve);
router.post('/:id/reject', authorize(['SECTORAL_MEASURE:REJECT']), SectoralMeasureController.reject);
router.post('/:id/return-to-draft', authorize(['SECTORAL_MEASURE:RETURN']), SectoralMeasureController.returnToDraft);

// Costing - /:id prefix routes
router.post('/:id/recalculate-costs', authorize(['SECTORAL_MEASURE:UPDATE']), SectoralMeasureController.recalculateCosts);

// Export
router.get('/:id/export/pdf', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.exportPdf);
router.get('/:id/export/excel', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.exportExcel);
router.get('/:id/export/csv', authorize(['SECTORAL_MEASURE:READ']), SectoralMeasureController.exportCsv);

export default router;
