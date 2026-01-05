import { Router } from 'express';
import { FunctionalClassificationController } from '../controllers/functionalClassification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des classifications fonctionnelles
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  FunctionalClassificationController.getStats
);

// Obtenir l'arborescence (REF:READ requis)
router.get(
  '/tree',
  authenticate,
  authorize(['REF:READ']),
  FunctionalClassificationController.getTree
);

// Obtenir toutes les classifications fonctionnelles (REF:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  FunctionalClassificationController.getAll
);

// Obtenir une classification fonctionnelle par code (REF:READ requis)
router.get(
  '/code/:code',
  authenticate,
  authorize(['REF:READ']),
  FunctionalClassificationController.getByCode
);

// Obtenir une classification fonctionnelle par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  FunctionalClassificationController.getById
);

// Créer une classification fonctionnelle (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  FunctionalClassificationController.create
);

// Mettre à jour une classification fonctionnelle (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  FunctionalClassificationController.update
);

// Restaurer une classification fonctionnelle (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  FunctionalClassificationController.restore
);

// Supprimer une classification fonctionnelle - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  FunctionalClassificationController.delete
);

export default router;
