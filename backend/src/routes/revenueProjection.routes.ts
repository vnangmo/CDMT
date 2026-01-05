import { Router } from 'express';
import { RevenueProjectionController } from '../controllers/revenueProjection.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des projections de recettes
 * Toutes les routes nécessitent une authentification
 */

// Obtenir toutes les projections de recettes (MACRO:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['MACRO:READ']),
  RevenueProjectionController.getAll
);

// Obtenir les projections par cadre macroéconomique (MACRO:READ requis)
router.get(
  '/macro-framework/:macroFrameworkId',
  authenticate,
  authorize(['MACRO:READ']),
  RevenueProjectionController.getByMacroFramework
);

// Obtenir le résumé des projections (MACRO:READ requis)
router.get(
  '/macro-framework/:macroFrameworkId/summary',
  authenticate,
  authorize(['MACRO:READ']),
  RevenueProjectionController.getSummary
);

// Recalculer toutes les projections d'un cadre macro (MACRO:UPDATE requis)
router.post(
  '/macro-framework/:macroFrameworkId/recalculate',
  authenticate,
  authorize(['MACRO:UPDATE']),
  RevenueProjectionController.recalculateAll
);

// Créer plusieurs projections en masse (MACRO:CREATE requis)
router.post(
  '/macro-framework/:macroFrameworkId/bulk',
  authenticate,
  authorize(['MACRO:CREATE']),
  RevenueProjectionController.createBulk
);

// Obtenir une projection de recettes par ID (MACRO:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['MACRO:READ']),
  RevenueProjectionController.getById
);

// Créer une projection de recettes (MACRO:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['MACRO:CREATE']),
  RevenueProjectionController.create
);

// Mettre à jour une projection de recettes (MACRO:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['MACRO:UPDATE']),
  RevenueProjectionController.update
);

// Recalculer une projection (MACRO:UPDATE requis)
router.post(
  '/:id/calculate',
  authenticate,
  authorize(['MACRO:UPDATE']),
  RevenueProjectionController.calculateProjection
);

// Supprimer une projection de recettes (MACRO:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['MACRO:DELETE']),
  RevenueProjectionController.delete
);

export default router;
