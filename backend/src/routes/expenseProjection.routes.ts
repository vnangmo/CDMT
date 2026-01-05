import { Router } from 'express';
import { ExpenseProjectionController } from '../controllers/expenseProjection.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des projections de dépenses
 * Toutes les routes nécessitent une authentification
 */

// Obtenir toutes les projections de dépenses (MACRO:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['MACRO:READ']),
  ExpenseProjectionController.getAll
);

// Obtenir les projections par cadre macroéconomique (MACRO:READ requis)
router.get(
  '/macro-framework/:macroFrameworkId',
  authenticate,
  authorize(['MACRO:READ']),
  ExpenseProjectionController.getByMacroFramework
);

// Obtenir le résumé des projections (MACRO:READ requis)
router.get(
  '/macro-framework/:macroFrameworkId/summary',
  authenticate,
  authorize(['MACRO:READ']),
  ExpenseProjectionController.getSummary
);

// Obtenir le solde budgétaire (MACRO:READ requis)
router.get(
  '/macro-framework/:macroFrameworkId/fiscal-balance',
  authenticate,
  authorize(['MACRO:READ']),
  ExpenseProjectionController.getFiscalBalance
);

// Obtenir les projections par ministère (MACRO:READ requis)
router.get(
  '/macro-framework/:macroFrameworkId/ministry/:ministryId',
  authenticate,
  authorize(['MACRO:READ']),
  ExpenseProjectionController.getByMinistry
);

// Créer plusieurs projections en masse (MACRO:CREATE requis)
router.post(
  '/macro-framework/:macroFrameworkId/bulk',
  authenticate,
  authorize(['MACRO:CREATE']),
  ExpenseProjectionController.createBulk
);

// Obtenir une projection de dépenses par ID (MACRO:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['MACRO:READ']),
  ExpenseProjectionController.getById
);

// Créer une projection de dépenses (MACRO:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['MACRO:CREATE']),
  ExpenseProjectionController.create
);

// Mettre à jour une projection de dépenses (MACRO:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['MACRO:UPDATE']),
  ExpenseProjectionController.update
);

// Recalculer une projection (MACRO:UPDATE requis)
router.post(
  '/:id/calculate',
  authenticate,
  authorize(['MACRO:UPDATE']),
  ExpenseProjectionController.calculateProjection
);

// Supprimer une projection de dépenses (MACRO:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['MACRO:DELETE']),
  ExpenseProjectionController.delete
);

export default router;
