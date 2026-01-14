import { Router } from 'express';
import { CDMTGlobalController } from '../controllers/cdmtGlobal.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ===== SCENARIOS =====

/**
 * @route   GET /api/v1/cdmt-global/scenarios
 * @desc    Obtenir tous les scénarios
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getScenarios
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:id
 * @desc    Obtenir un scénario par ID
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:id',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getScenarioById
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios
 * @desc    Créer un scénario
 * @access  Private (CDMT_GLOBAL:CREATE)
 */
router.post(
  '/scenarios',
  authenticate,
  authorize(['CDMT_GLOBAL:CREATE', 'ADMIN:CREATE']),
  CDMTGlobalController.createScenario
);

/**
 * @route   PUT /api/v1/cdmt-global/scenarios/:id
 * @desc    Mettre à jour un scénario
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.put(
  '/scenarios/:id',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.updateScenario
);

/**
 * @route   DELETE /api/v1/cdmt-global/scenarios/:id
 * @desc    Supprimer un scénario
 * @access  Private (CDMT_GLOBAL:DELETE)
 */
router.delete(
  '/scenarios/:id',
  authenticate,
  authorize(['CDMT_GLOBAL:DELETE', 'ADMIN:DELETE']),
  CDMTGlobalController.deleteScenario
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:id/duplicate
 * @desc    Dupliquer un scénario
 * @access  Private (CDMT_GLOBAL:CREATE)
 */
router.post(
  '/scenarios/:id/duplicate',
  authenticate,
  authorize(['CDMT_GLOBAL:CREATE', 'ADMIN:CREATE']),
  CDMTGlobalController.duplicateScenario
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:id/activate
 * @desc    Activer un scénario
 * @access  Private (CDMT_GLOBAL:ACTIVATE)
 */
router.post(
  '/scenarios/:id/activate',
  authenticate,
  authorize(['CDMT_GLOBAL:ACTIVATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.activateScenario
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:id/deactivate
 * @desc    Désactiver un scénario
 * @access  Private (CDMT_GLOBAL:ACTIVATE)
 */
router.post(
  '/scenarios/:id/deactivate',
  authenticate,
  authorize(['CDMT_GLOBAL:ACTIVATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.deactivateScenario
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:id/archive
 * @desc    Archiver un scénario
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:id/archive',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.archiveScenario
);

// ===== POLICY MEASURES =====

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/measures
 * @desc    Obtenir les mesures nouvelles d'un scénario
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/measures',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getPolicyMeasures
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/measures
 * @desc    Créer une mesure nouvelle
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/measures',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:CREATE']),
  CDMTGlobalController.createPolicyMeasure
);

/**
 * @route   PUT /api/v1/cdmt-global/measures/:id
 * @desc    Mettre à jour une mesure nouvelle
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.put(
  '/measures/:id',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.updatePolicyMeasure
);

/**
 * @route   DELETE /api/v1/cdmt-global/measures/:id
 * @desc    Supprimer une mesure nouvelle
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.delete(
  '/measures/:id',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:DELETE']),
  CDMTGlobalController.deletePolicyMeasure
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/measures/bulk
 * @desc    Import massif de mesures nouvelles
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/measures/bulk',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:CREATE']),
  CDMTGlobalController.bulkImportPolicyMeasures
);

// ===== MARGIN ALLOCATION =====

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/allocations
 * @desc    Obtenir les allocations de marge d'un scénario
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/allocations',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getMarginAllocations
);

/**
 * @route   PUT /api/v1/cdmt-global/scenarios/:scenarioId/allocations/:ministryId
 * @desc    Mettre à jour l'allocation de marge pour un ministère
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.put(
  '/scenarios/:scenarioId/allocations/:ministryId',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.updateMarginAllocation
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/allocations/bulk
 * @desc    Mise à jour multiple d'allocations
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/allocations/bulk',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.bulkUpdateMarginAllocations
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/allocations/reset
 * @desc    Réinitialiser toutes les allocations à 0
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/allocations/reset',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.resetMarginAllocations
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/margin-remaining
 * @desc    Obtenir la marge restante à allouer
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/margin-remaining',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getRemainingMargin
);

// ===== MINISTERIAL CEILINGS =====

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/ceilings
 * @desc    Obtenir les plafonds ministériels d'un scénario
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/ceilings',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getMinisterialCeilings
);

// ===== REQ-GLOB-05: CEILING CALCULATION BY CATEGORY =====
// NOTE: This route MUST be defined BEFORE /ceilings/:ministryId to avoid capturing 'by-category' as ministryId

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/ceilings/by-category
 * @desc    Calculate ministerial ceilings with category breakdown
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/ceilings/by-category',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.calculateCeilingsByCategory
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/ceilings/:ministryId
 * @desc    Obtenir le plafond d'un ministère pour un scénario
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/ceilings/:ministryId',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getMinisterialCeilingByMinistry
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/calculate
 * @desc    Recalculer tous les plafonds d'un scénario
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/calculate',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.recalculateCeilings
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/validate
 * @desc    Valider les allocations de marge
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/validate',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.validateAllocations
);

// ===== COMPARISON =====

/**
 * @route   POST /api/v1/cdmt-global/compare
 * @desc    Comparer plusieurs scénarios
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.post(
  '/compare',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.compareScenarios
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:id1/diff/:id2
 * @desc    Obtenir les différences détaillées entre deux scénarios
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:id1/diff/:id2',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getScenarioDifferences
);

// ===== CBMT INTEGRATION =====

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/sync-cbmt
 * @desc    Synchroniser les plafonds vers CBMT
 * @access  Private (CDMT_GLOBAL:CBMT_SYNC)
 */
router.post(
  '/scenarios/:scenarioId/sync-cbmt',
  authenticate,
  authorize(['CDMT_GLOBAL:CBMT_SYNC', 'ADMIN:UPDATE']),
  CDMTGlobalController.syncCBMT
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/create-cbmt
 * @desc    Créer un document CBMT depuis un scénario
 * @access  Private (CDMT_GLOBAL:CBMT_SYNC)
 */
router.post(
  '/scenarios/:scenarioId/create-cbmt',
  authenticate,
  authorize(['CDMT_GLOBAL:CBMT_SYNC', 'ADMIN:CREATE']),
  CDMTGlobalController.createCBMT
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/cbmt-coherence/:cbmtId
 * @desc    Valider la cohérence avec CBMT
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/cbmt-coherence/:cbmtId',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.validateCBMTCoherence
);

// ===== EXPORTS =====

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/export/excel
 * @desc    Exporter vers Excel
 * @access  Private (CDMT_GLOBAL:EXPORT)
 */
router.get(
  '/scenarios/:scenarioId/export/excel',
  authenticate,
  authorize(['CDMT_GLOBAL:EXPORT', 'CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.exportExcel
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/export/csv
 * @desc    Exporter vers CSV
 * @access  Private (CDMT_GLOBAL:EXPORT)
 */
router.get(
  '/scenarios/:scenarioId/export/csv',
  authenticate,
  authorize(['CDMT_GLOBAL:EXPORT', 'CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.exportCSV
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/export/pdf
 * @desc    Exporter vers PDF
 * @access  Private (CDMT_GLOBAL:EXPORT)
 */
router.get(
  '/scenarios/:scenarioId/export/pdf',
  authenticate,
  authorize(['CDMT_GLOBAL:EXPORT', 'CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.exportPDF
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/comparison-report
 * @desc    Obtenir le rapport comparatif
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/comparison-report',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getComparisonReport
);

// ===== REQ-GLOB-01: ENHANCED TREND BUDGET CALCULATION =====

/**
 * @route   GET /api/v1/cdmt-global/growth-hypotheses
 * @desc    Get default growth hypotheses by category
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/growth-hypotheses',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getGrowthHypotheses
);

/**
 * @route   GET /api/v1/cdmt-global/trend-config/:trendConfigId/temporary-expenses
 * @desc    Identify temporary expenses in trend configuration
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/trend-config/:trendConfigId/temporary-expenses',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.identifyTemporaryExpenses
);

/**
 * @route   POST /api/v1/cdmt-global/trend-config/:trendConfigId/trend-budgets
 * @desc    Calculate trend budgets by ministry with category breakdown
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.post(
  '/trend-config/:trendConfigId/trend-budgets',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.calculateTrendBudgetsByMinistry
);

// ===== REQ-GLOB-02: ENHANCED FISCAL MARGIN CALCULATION =====

/**
 * @route   GET /api/v1/cdmt-global/macro-framework/:macroFrameworkId/enhanced-margin
 * @desc    Calculate enhanced fiscal margin with category and resource type breakdown
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/macro-framework/:macroFrameworkId/enhanced-margin',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.calculateEnhancedFiscalMargin
);

// ===== REQ-GLOB-03: CENTRAL NEW MEASURES WITH TRACEABILITY =====

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/measures/traceable
 * @desc    Create policy measure with full traceability
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/measures/traceable',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:CREATE']),
  CDMTGlobalController.createPolicyMeasureWithTraceability
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/measures/aggregated
 * @desc    Get measures aggregated by ministry
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/measures/aggregated',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getMeasuresByMinistryAggregated
);

// ===== REQ-GLOB-04: MARGIN DISTRIBUTION WITH JUSTIFICATIONS =====

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/allocations/suggest
 * @desc    Suggest margin allocation based on strategy
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/allocations/suggest',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.suggestMarginAllocation
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/allocations/apply
 * @desc    Apply margin allocation with justification requirement
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/allocations/apply',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.applyMarginAllocationWithJustification
);

// ===== REQ-GLOB-06: CBMT-CDMT GLOBAL ITERATION =====

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/iteration/initialize
 * @desc    Initialize iteration between CDMT Global and CBMT
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/iteration/initialize',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.initializeIteration
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/iteration/:cbmtDocumentId/adjust
 * @desc    Perform iteration adjustment
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/iteration/:cbmtDocumentId/adjust',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.performIterationAdjustment
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/iteration/summary
 * @desc    Get iteration summary
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/iteration/summary',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getIterationSummary
);

/**
 * @route   GET /api/v1/cdmt-global/scenarios/:scenarioId/iteration/:cbmtDocumentId/convergence
 * @desc    Validate convergence between CDMT Global and CBMT
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/scenarios/:scenarioId/iteration/:cbmtDocumentId/convergence',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.validateConvergence
);

// ===== INTEGRATION MODULE FISCAL MARGINS =====

/**
 * @route   GET /api/v1/cdmt-global/fiscal-margin/:macroFrameworkId/available-margins
 * @desc    Obtenir les marges disponibles depuis le module FiscalMargin
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/fiscal-margin/:macroFrameworkId/available-margins',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getAvailableMarginsFromModule
);

/**
 * @route   GET /api/v1/cdmt-global/fiscal-margin/:macroFrameworkId/reserve-rates
 * @desc    Obtenir les taux de réserves depuis le module FiscalMargin
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/fiscal-margin/:macroFrameworkId/reserve-rates',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getReserveRatesFromModule
);

/**
 * @route   GET /api/v1/cdmt-global/fiscal-margin/:macroFrameworkId/distribution-keys
 * @desc    Obtenir les clés de répartition depuis le module FiscalMargin
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/fiscal-margin/:macroFrameworkId/distribution-keys',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getDistributionKeysFromModule
);

/**
 * @route   GET /api/v1/cdmt-global/fiscal-margin/:macroFrameworkId/ministry-margins
 * @desc    Obtenir les marges par ministère depuis le module FiscalMargin
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/fiscal-margin/:macroFrameworkId/ministry-margins',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getMinistryMarginsFromModule
);

/**
 * @route   GET /api/v1/cdmt-global/fiscal-margin/:macroFrameworkId/summary
 * @desc    Obtenir le résumé de l'intégration FiscalMargin
 * @access  Private (CDMT_GLOBAL:READ)
 */
router.get(
  '/fiscal-margin/:macroFrameworkId/summary',
  authenticate,
  authorize(['CDMT_GLOBAL:READ', 'ADMIN:READ']),
  CDMTGlobalController.getFiscalMarginIntegrationSummary
);

/**
 * @route   POST /api/v1/cdmt-global/scenarios/:scenarioId/calculate-with-fiscal-margin
 * @desc    Calculer les plafonds en utilisant les données du module FiscalMargin
 * @access  Private (CDMT_GLOBAL:UPDATE)
 */
router.post(
  '/scenarios/:scenarioId/calculate-with-fiscal-margin',
  authenticate,
  authorize(['CDMT_GLOBAL:UPDATE', 'ADMIN:UPDATE']),
  CDMTGlobalController.calculateCeilingsWithFiscalMargin
);

export default router;
