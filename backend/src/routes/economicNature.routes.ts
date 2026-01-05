import { Router } from 'express';
import { EconomicNatureController } from '../controllers/economicNature.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des natures économiques
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  EconomicNatureController.getStats
);

// Obtenir toutes les natures économiques (REF:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  EconomicNatureController.getAll
);

// Obtenir une nature économique par code (REF:READ requis)
router.get(
  '/code/:code',
  authenticate,
  authorize(['REF:READ']),
  EconomicNatureController.getByCode
);

// Obtenir une nature économique par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  EconomicNatureController.getById
);

// Créer une nature économique (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  EconomicNatureController.create
);

// Mettre à jour une nature économique (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  EconomicNatureController.update
);

// Restaurer une nature économique (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  EconomicNatureController.restore
);

// Supprimer une nature économique - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  EconomicNatureController.delete
);

export default router;
