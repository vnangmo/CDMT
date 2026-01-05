import { Router } from 'express';
import { MacroFrameworkController } from '../controllers/macroFramework.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des cadres macroéconomiques
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (MACRO:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['MACRO:READ']),
  MacroFrameworkController.getStats
);

// Obtenir tous les cadres macroéconomiques (MACRO:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['MACRO:READ']),
  MacroFrameworkController.getAll
);

// Obtenir un cadre macroéconomique par année (MACRO:READ requis)
router.get(
  '/year/:year/:budgetYear',
  authenticate,
  authorize(['MACRO:READ']),
  MacroFrameworkController.getByYear
);

// Obtenir un cadre macroéconomique par ID (MACRO:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['MACRO:READ']),
  MacroFrameworkController.getById
);

// Créer un cadre macroéconomique (MACRO:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['MACRO:CREATE']),
  MacroFrameworkController.create
);

// Mettre à jour un cadre macroéconomique (MACRO:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['MACRO:UPDATE']),
  MacroFrameworkController.update
);

// Valider un cadre macroéconomique (MACRO:VALIDATE requis)
router.patch(
  '/:id/validate',
  authenticate,
  authorize(['MACRO:VALIDATE']),
  MacroFrameworkController.validate
);

// Approuver un cadre macroéconomique (MACRO:VALIDATE requis)
router.patch(
  '/:id/approve',
  authenticate,
  authorize(['MACRO:VALIDATE']),
  MacroFrameworkController.approve
);

// Rejeter un cadre macroéconomique (MACRO:VALIDATE requis)
router.patch(
  '/:id/reject',
  authenticate,
  authorize(['MACRO:VALIDATE']),
  MacroFrameworkController.reject
);

// Valider la cohérence d'un cadre macroéconomique (MACRO:READ requis)
router.get(
  '/:id/validate-coherence',
  authenticate,
  authorize(['MACRO:READ']),
  MacroFrameworkController.validateCoherence
);

// Obtenir les statistiques globales d'un cadre macroéconomique (MACRO:READ requis)
router.get(
  '/:id/global-stats',
  authenticate,
  authorize(['MACRO:READ']),
  MacroFrameworkController.getGlobalStats
);

// Supprimer un cadre macroéconomique (MACRO:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['MACRO:DELETE']),
  MacroFrameworkController.delete
);

export default router;
