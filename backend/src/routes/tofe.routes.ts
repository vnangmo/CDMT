import { Router } from 'express';
import { TOFEController } from '../controllers/tofe.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des documents TOFE (Tableau des Opérations Financières de l'État)
 * Toutes les routes nécessitent une authentification
 */

// === ROUTES DOCUMENTS TOFE ===

// Obtenir tous les documents TOFE (MACRO:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.getAll
);

// Obtenir un document TOFE par ID (MACRO:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.getById
);

// Obtenir un document TOFE par cadre macro et année (MACRO:READ requis)
router.get(
  '/macro/:macroFrameworkId/year/:fiscalYear',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.getByMacroFrameworkAndYear
);

// Créer un document TOFE (MACRO:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['MACRO:CREATE']),
  TOFEController.create
);

// Générer automatiquement un document TOFE à partir d'un cadre macro (MACRO:CREATE requis)
router.post(
  '/generate/:macroFrameworkId',
  authenticate,
  authorize(['MACRO:CREATE']),
  TOFEController.generateFromMacroFramework
);

// Mettre à jour un document TOFE (MACRO:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['MACRO:UPDATE']),
  TOFEController.update
);

// Valider un document TOFE (MACRO:VALIDATE requis)
router.patch(
  '/:id/validate',
  authenticate,
  authorize(['MACRO:VALIDATE']),
  TOFEController.validate
);

// Approuver un document TOFE (MACRO:VALIDATE requis)
router.patch(
  '/:id/approve',
  authenticate,
  authorize(['MACRO:VALIDATE']),
  TOFEController.approve
);

// Supprimer un document TOFE (MACRO:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['MACRO:DELETE']),
  TOFEController.delete
);

// === ROUTES LIGNES TOFE ===

// Obtenir les lignes d'un document TOFE (MACRO:READ requis)
router.get(
  '/:id/lines',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.getLines
);

// Créer une ligne TOFE (MACRO:UPDATE requis)
router.post(
  '/:id/lines',
  authenticate,
  authorize(['MACRO:UPDATE']),
  TOFEController.createLine
);

// Mettre à jour une ligne TOFE (MACRO:UPDATE requis)
router.put(
  '/:id/lines/:lineId',
  authenticate,
  authorize(['MACRO:UPDATE']),
  TOFEController.updateLine
);

// Supprimer une ligne TOFE (MACRO:UPDATE requis)
router.delete(
  '/:id/lines/:lineId',
  authenticate,
  authorize(['MACRO:UPDATE']),
  TOFEController.deleteLine
);

// === ROUTES CALCULS ===

// Recalculer toutes les lignes d'un document TOFE (MACRO:UPDATE requis)
router.post(
  '/:id/recalculate',
  authenticate,
  authorize(['MACRO:UPDATE']),
  TOFEController.recalculate
);

// Calculer le solde budgétaire (MACRO:READ requis)
router.get(
  '/:id/fiscal-balance',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.calculateFiscalBalance
);

// Vérifier la cohérence d'un document TOFE (MACRO:READ requis)
router.get(
  '/:id/consistency',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.checkConsistency
);

// Calculer les ratios budgétaires (MACRO:READ requis)
router.get(
  '/:id/ratios',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.calculateRatios
);

// Obtenir un résumé du document TOFE (MACRO:READ requis)
router.get(
  '/:id/summary',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.getSummary
);

// === ROUTES EXPORT ===

// Exporter un document TOFE en Excel (MACRO:READ requis)
router.get(
  '/:id/export/excel',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.exportToExcel
);

// Exporter un document TOFE en PDF (MACRO:READ requis)
router.get(
  '/:id/export/pdf',
  authenticate,
  authorize(['MACRO:READ']),
  TOFEController.exportToPDF
);

export default router;
