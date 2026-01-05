import { Router } from 'express';
import { TrendBudgetController } from '../controllers/trendBudget.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload, handleMulterError } from '../config/multer.config';

const router = Router();

// ===== TREND BUDGET CONFIG =====

/**
 * @route   GET /api/v1/trend-budgets
 * @desc    Obtenir toutes les configurations
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getAll
);

/**
 * @route   GET /api/v1/trend-budgets/:id
 * @desc    Obtenir une configuration par ID
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/:id',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getById
);

/**
 * @route   POST /api/v1/trend-budgets
 * @desc    Créer une configuration
 * @access  Private (TREND_BUDGET:CREATE)
 */
router.post(
  '/',
  authenticate,
  authorize(['TREND_BUDGET:CREATE', 'ADMIN:CREATE']),
  TrendBudgetController.create
);

/**
 * @route   PUT /api/v1/trend-budgets/:id
 * @desc    Mettre à jour une configuration
 * @access  Private (TREND_BUDGET:UPDATE)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['TREND_BUDGET:UPDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.update
);

/**
 * @route   DELETE /api/v1/trend-budgets/:id
 * @desc    Supprimer une configuration
 * @access  Private (TREND_BUDGET:DELETE)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['TREND_BUDGET:DELETE', 'ADMIN:DELETE']),
  TrendBudgetController.delete
);

/**
 * @route   POST /api/v1/trend-budgets/:id/validate
 * @desc    Valider une configuration
 * @access  Private (TREND_BUDGET:VALIDATE)
 */
router.post(
  '/:id/validate',
  authenticate,
  authorize(['TREND_BUDGET:VALIDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.validate
);

/**
 * @route   POST /api/v1/trend-budgets/:id/approve
 * @desc    Approuver une configuration
 * @access  Private (TREND_BUDGET:VALIDATE)
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize(['TREND_BUDGET:VALIDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.approve
);

// ===== HISTORICAL BUDGETS =====

/**
 * @route   GET /api/v1/trend-budgets/:configId/historical
 * @desc    Obtenir les budgets historiques
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/:configId/historical',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getHistoricalBudgets
);

/**
 * @route   POST /api/v1/trend-budgets/historical
 * @desc    Créer un budget historique
 * @access  Private (TREND_BUDGET:CREATE)
 */
router.post(
  '/historical',
  authenticate,
  authorize(['TREND_BUDGET:CREATE', 'ADMIN:CREATE']),
  TrendBudgetController.createHistoricalBudget
);

/**
 * @route   PUT /api/v1/trend-budgets/historical/:id
 * @desc    Mettre à jour un budget historique
 * @access  Private (TREND_BUDGET:UPDATE)
 */
router.put(
  '/historical/:id',
  authenticate,
  authorize(['TREND_BUDGET:UPDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.updateHistoricalBudget
);

/**
 * @route   DELETE /api/v1/trend-budgets/historical/:id
 * @desc    Supprimer un budget historique
 * @access  Private (TREND_BUDGET:DELETE)
 */
router.delete(
  '/historical/:id',
  authenticate,
  authorize(['TREND_BUDGET:DELETE', 'ADMIN:DELETE']),
  TrendBudgetController.deleteHistoricalBudget
);

/**
 * @route   POST /api/v1/trend-budgets/historical/:id/toggle-temporary
 * @desc    Basculer le flag isTemporary
 * @access  Private (TREND_BUDGET:UPDATE)
 */
router.post(
  '/historical/:id/toggle-temporary',
  authenticate,
  authorize(['TREND_BUDGET:UPDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.toggleTemporary
);

// ===== IMPORT =====

/**
 * @route   GET /api/v1/trend-budgets/import/template
 * @desc    Télécharger le template d'import
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/import/template',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.downloadTemplate
);

/**
 * @route   POST /api/v1/trend-budgets/:configId/import/excel
 * @desc    Importer depuis Excel
 * @access  Private (TREND_BUDGET:IMPORT)
 */
router.post(
  '/:configId/import/excel',
  authenticate,
  authorize(['TREND_BUDGET:IMPORT', 'TREND_BUDGET:CREATE', 'ADMIN:CREATE']),
  upload.single('file'),
  handleMulterError,
  TrendBudgetController.importExcel
);

/**
 * @route   POST /api/v1/trend-budgets/:configId/import/csv
 * @desc    Importer depuis CSV
 * @access  Private (TREND_BUDGET:IMPORT)
 */
router.post(
  '/:configId/import/csv',
  authenticate,
  authorize(['TREND_BUDGET:IMPORT', 'TREND_BUDGET:CREATE', 'ADMIN:CREATE']),
  upload.single('file'),
  handleMulterError,
  TrendBudgetController.importCSV
);

// ===== PROJECTIONS =====

/**
 * @route   GET /api/v1/trend-budgets/:configId/projections
 * @desc    Obtenir les projections
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/:configId/projections',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getTrendProjections
);

/**
 * @route   GET /api/v1/trend-budgets/projection/:id
 * @desc    Obtenir une projection par ID
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/projection/:id',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getTrendProjectionById
);

/**
 * @route   PUT /api/v1/trend-budgets/projection/:id
 * @desc    Mettre à jour une projection
 * @access  Private (TREND_BUDGET:UPDATE)
 */
router.put(
  '/projection/:id',
  authenticate,
  authorize(['TREND_BUDGET:UPDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.updateTrendProjection
);

/**
 * @route   POST /api/v1/trend-budgets/:configId/calculate
 * @desc    Calculer toutes les projections
 * @access  Private (TREND_BUDGET:UPDATE)
 */
router.post(
  '/:configId/calculate',
  authenticate,
  authorize(['TREND_BUDGET:UPDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.calculateProjections
);

/**
 * @route   POST /api/v1/trend-budgets/projection/:id/recalculate
 * @desc    Recalculer une projection
 * @access  Private (TREND_BUDGET:UPDATE)
 */
router.post(
  '/projection/:id/recalculate',
  authenticate,
  authorize(['TREND_BUDGET:UPDATE', 'ADMIN:UPDATE']),
  TrendBudgetController.recalculateProjection
);

// ===== SUMMARIES =====

/**
 * @route   GET /api/v1/trend-budgets/:configId/summary/ministry
 * @desc    Obtenir le résumé par ministère
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/:configId/summary/ministry',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getSummaryByMinistry
);

/**
 * @route   GET /api/v1/trend-budgets/:configId/summary/priority
 * @desc    Obtenir le résumé par priorité
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/:configId/summary/priority',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getSummaryByPriority
);

/**
 * @route   GET /api/v1/trend-budgets/:configId/validate-coherence
 * @desc    Valider la cohérence
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/:configId/validate-coherence',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.validateCoherence
);

// ===== EXPORTS =====

/**
 * @route   GET /api/v1/trend-budgets/:configId/export/excel
 * @desc    Exporter vers Excel
 * @access  Private (TREND_BUDGET:EXPORT)
 */
router.get(
  '/:configId/export/excel',
  authenticate,
  authorize(['TREND_BUDGET:EXPORT', 'TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.exportExcel
);

/**
 * @route   GET /api/v1/trend-budgets/:configId/export/csv
 * @desc    Exporter vers CSV
 * @access  Private (TREND_BUDGET:EXPORT)
 */
router.get(
  '/:configId/export/csv',
  authenticate,
  authorize(['TREND_BUDGET:EXPORT', 'TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.exportCSV
);

/**
 * @route   GET /api/v1/trend-budgets/:configId/export/pdf
 * @desc    Exporter vers PDF
 * @access  Private (TREND_BUDGET:EXPORT)
 */
router.get(
  '/:configId/export/pdf',
  authenticate,
  authorize(['TREND_BUDGET:EXPORT', 'TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.exportPDF
);

/**
 * @route   GET /api/v1/trend-budgets/:configId/comparison-report
 * @desc    Obtenir le rapport comparatif
 * @access  Private (TREND_BUDGET:READ)
 */
router.get(
  '/:configId/comparison-report',
  authenticate,
  authorize(['TREND_BUDGET:READ', 'ADMIN:READ']),
  TrendBudgetController.getComparisonReport
);

export default router;
