import { Router } from 'express';
import { StrategicAxisController } from '../controllers/strategicAxis.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des axes stratégiques
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  StrategicAxisController.getStats
);

// Obtenir tous les axes stratégiques (REF:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  StrategicAxisController.getAll
);

// Obtenir un axe stratégique par code (REF:READ requis)
router.get(
  '/code/:code',
  authenticate,
  authorize(['REF:READ']),
  StrategicAxisController.getByCode
);

// Obtenir un axe stratégique par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  StrategicAxisController.getById
);

// Créer un axe stratégique (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  StrategicAxisController.create
);

// Mettre à jour un axe stratégique (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  StrategicAxisController.update
);

// Restaurer un axe stratégique (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  StrategicAxisController.restore
);

// Supprimer un axe stratégique - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  StrategicAxisController.delete
);

export default router;
