import { Router } from 'express';
import { CustomExportController } from '../controllers/customExport.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All export routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/export/entity-types
 * @desc Get all supported entity types for export
 * @access Private
 */
router.get('/entity-types', CustomExportController.getEntityTypes);

/**
 * @route GET /api/v1/export/columns/:entityType
 * @desc Get available columns for an entity type
 * @access Private
 * @param entityType - The entity type (SectoralMeasure, ActionPlan, etc.)
 */
router.get('/columns/:entityType', CustomExportController.getColumns);

/**
 * @route POST /api/v1/export/generate
 * @desc Generate a custom export with selected columns and filters
 * @access Private
 * @body {
 *   entityType: string (required),
 *   columns: string[] (optional - defaults to all),
 *   filters: Array<{field, operator, value}> (optional),
 *   sort: Array<{field, direction}> (optional),
 *   format: 'excel' | 'csv' | 'pdf' (default: 'excel'),
 *   title: string (optional),
 *   includeHeaders: boolean (default: true),
 *   fiscalYear: number (optional),
 *   ministryId: string (optional)
 * }
 */
router.post('/generate', CustomExportController.generateExport);

/**
 * @route POST /api/v1/export/sectoral-measures
 * @desc Export sectoral measures with custom options
 * @access Private
 */
router.post('/sectoral-measures', CustomExportController.exportSectoralMeasures);

/**
 * @route POST /api/v1/export/action-plans
 * @desc Export action plans with custom options
 * @access Private
 */
router.post('/action-plans', CustomExportController.exportActionPlans);

/**
 * @route POST /api/v1/export/ministerial-ceilings
 * @desc Export ministerial ceilings with custom options
 * @access Private
 */
router.post('/ministerial-ceilings', CustomExportController.exportMinisterialCeilings);

/**
 * @route POST /api/v1/export/cbmt-documents
 * @desc Export CBMT documents with custom options
 * @access Private
 */
router.post('/cbmt-documents', CustomExportController.exportCBMTDocuments);

/**
 * @route POST /api/v1/export/cdmt-scenarios
 * @desc Export CDMT Global scenarios with custom options
 * @access Private
 */
router.post('/cdmt-scenarios', CustomExportController.exportCDMTScenarios);

export default router;
