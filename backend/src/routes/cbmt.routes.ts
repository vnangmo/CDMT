import { Router } from 'express';
import { CBMTController } from '../controllers/cbmt.controller';
import { authenticate, authorize, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// ===== DOCUMENTS CBMT =====

/**
 * GET /cbmt
 * Obtenir tous les documents CBMT
 */
router.get(
  '/',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getAll
);

/**
 * GET /cbmt/:id
 * Obtenir un document CBMT par ID
 */
router.get(
  '/:id',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getById
);

/**
 * GET /cbmt/macro/:macroFrameworkId/year/:fiscalYear
 * Obtenir un document CBMT par cadre macro et année
 */
router.get(
  '/macro/:macroFrameworkId/year/:fiscalYear',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getByMacroFrameworkAndYear
);

/**
 * POST /cbmt
 * Créer un document CBMT
 */
router.post(
  '/',
  checkPermission('MACRO', 'canCreate'),
  CBMTController.create
);

/**
 * PUT /cbmt/:id
 * Mettre à jour un document CBMT
 */
router.put(
  '/:id',
  checkPermission('MACRO', 'canUpdate'),
  CBMTController.update
);

/**
 * DELETE /cbmt/:id
 * Supprimer un document CBMT
 */
router.delete(
  '/:id',
  checkPermission('MACRO', 'canDelete'),
  CBMTController.delete
);

/**
 * POST /cbmt/:id/validate
 * Valider un document CBMT
 */
router.post(
  '/:id/validate',
  checkPermission('MACRO', 'canValidate'),
  CBMTController.validate
);

/**
 * POST /cbmt/:id/approve
 * Approuver un document CBMT
 */
router.post(
  '/:id/approve',
  checkPermission('MACRO', 'canValidate'),
  CBMTController.approve
);

/**
 * POST /cbmt/generate/macro/:macroFrameworkId
 * Générer un CBMT depuis un TOFE
 */
router.post(
  '/generate/macro/:macroFrameworkId',
  checkPermission('MACRO', 'canCreate'),
  CBMTController.generateFromTOFE
);

// ===== AGRÉGATS =====

/**
 * GET /cbmt/:cbmtDocumentId/aggregates
 * Obtenir les agrégats d'un document CBMT
 */
router.get(
  '/:cbmtDocumentId/aggregates',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getAggregates
);

/**
 * POST /cbmt/aggregates
 * Créer un agrégat CBMT
 */
router.post(
  '/aggregates',
  checkPermission('MACRO', 'canCreate'),
  CBMTController.createAggregate
);

/**
 * PUT /cbmt/aggregates/:id
 * Mettre à jour un agrégat CBMT
 */
router.put(
  '/aggregates/:id',
  checkPermission('MACRO', 'canUpdate'),
  CBMTController.updateAggregate
);

/**
 * DELETE /cbmt/aggregates/:id
 * Supprimer un agrégat CBMT
 */
router.delete(
  '/aggregates/:id',
  checkPermission('MACRO', 'canDelete'),
  CBMTController.deleteAggregate
);

// ===== RÉSERVES =====

/**
 * GET /cbmt/:cbmtDocumentId/reserves
 * Obtenir les réserves d'un document CBMT
 */
router.get(
  '/:cbmtDocumentId/reserves',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getReserves
);

/**
 * POST /cbmt/reserves
 * Créer une réserve CBMT
 */
router.post(
  '/reserves',
  checkPermission('MACRO', 'canCreate'),
  CBMTController.createReserve
);

/**
 * PUT /cbmt/reserves/:id
 * Mettre à jour une réserve CBMT
 */
router.put(
  '/reserves/:id',
  checkPermission('MACRO', 'canUpdate'),
  CBMTController.updateReserve
);

/**
 * DELETE /cbmt/reserves/:id
 * Supprimer une réserve CBMT
 */
router.delete(
  '/reserves/:id',
  checkPermission('MACRO', 'canDelete'),
  CBMTController.deleteReserve
);

/**
 * POST /cbmt/reserves/:id/allocate
 * Allouer une réserve
 */
router.post(
  '/reserves/:id/allocate',
  checkPermission('MACRO', 'canUpdate'),
  CBMTController.allocateReserve
);

// ===== CALCULS =====

/**
 * POST /cbmt/:cbmtDocumentId/calculations/recalculate-gaps
 * Recalculer les écarts
 */
router.post(
  '/:cbmtDocumentId/calculations/recalculate-gaps',
  checkPermission('MACRO', 'canUpdate'),
  CBMTController.recalculateGaps
);

/**
 * GET /cbmt/:cbmtDocumentId/calculations/analyze-gaps
 * Analyser les écarts budgétaires
 */
router.get(
  '/:cbmtDocumentId/calculations/analyze-gaps',
  checkPermission('MACRO', 'canRead'),
  CBMTController.analyzeGaps
);

/**
 * GET /cbmt/:cbmtDocumentId/calculations/budget-summary
 * Obtenir le résumé budgétaire
 */
router.get(
  '/:cbmtDocumentId/calculations/budget-summary',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getBudgetSummary
);

/**
 * POST /cbmt/:cbmtDocumentId/calculations/spending-ceilings
 * Calculer les plafonds de dépenses
 */
router.post(
  '/:cbmtDocumentId/calculations/spending-ceilings',
  checkPermission('MACRO', 'canUpdate'),
  CBMTController.calculateSpendingCeilings
);

/**
 * GET /cbmt/:cbmtDocumentId/calculations/detect-overruns
 * Détecter les dépassements
 */
router.get(
  '/:cbmtDocumentId/calculations/detect-overruns',
  checkPermission('MACRO', 'canRead'),
  CBMTController.detectOverruns
);

// ===== ANALYSES =====

/**
 * GET /cbmt/:cbmtDocumentId/analyses
 * Obtenir toutes les analyses
 */
router.get(
  '/:cbmtDocumentId/analyses',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getAnalyses
);

/**
 * GET /cbmt/analyses/:id
 * Obtenir une analyse par ID
 */
router.get(
  '/analyses/:id',
  checkPermission('MACRO', 'canRead'),
  CBMTController.getAnalysisById
);

/**
 * POST /cbmt/:cbmtDocumentId/analyses/sensitivity
 * Exécuter une analyse de sensibilité
 */
router.post(
  '/:cbmtDocumentId/analyses/sensitivity',
  checkPermission('MACRO', 'canCreate'),
  CBMTController.runSensitivityAnalysis
);

/**
 * POST /cbmt/:cbmtDocumentId/analyses/shock
 * Exécuter une simulation de choc
 */
router.post(
  '/:cbmtDocumentId/analyses/shock',
  checkPermission('MACRO', 'canCreate'),
  CBMTController.runShockSimulation
);

/**
 * POST /cbmt/:cbmtDocumentId/analyses/sustainability
 * Calculer les ratios de soutenabilité
 */
router.post(
  '/:cbmtDocumentId/analyses/sustainability',
  checkPermission('MACRO', 'canCreate'),
  CBMTController.calculateSustainabilityRatios
);

/**
 * DELETE /cbmt/analyses/:id
 * Supprimer une analyse
 */
router.delete(
  '/analyses/:id',
  checkPermission('MACRO', 'canDelete'),
  CBMTController.deleteAnalysis
);

// ===== EXPORTS =====

/**
 * GET /cbmt/:cbmtDocumentId/export/excel
 * Exporter en Excel
 */
router.get(
  '/:cbmtDocumentId/export/excel',
  checkPermission('MACRO', 'canRead'),
  CBMTController.exportToExcel
);

/**
 * GET /cbmt/:cbmtDocumentId/export/pdf
 * Exporter en PDF
 */
router.get(
  '/:cbmtDocumentId/export/pdf',
  checkPermission('MACRO', 'canRead'),
  CBMTController.exportToPDF
);

export default router;
