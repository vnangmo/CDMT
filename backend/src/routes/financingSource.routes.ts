import { Router } from 'express';
import { FinancingSourceController } from '../controllers/financingSource.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des sources de financement
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  FinancingSourceController.getStats
);

// Obtenir toutes les sources de financement (REF:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  FinancingSourceController.getAll
);

// Obtenir une source de financement par code (REF:READ requis)
router.get(
  '/code/:code',
  authenticate,
  authorize(['REF:READ']),
  FinancingSourceController.getByCode
);

// Obtenir une source de financement par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  FinancingSourceController.getById
);

// Créer une source de financement (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  FinancingSourceController.create
);

// Mettre à jour une source de financement (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  FinancingSourceController.update
);

// Restaurer une source de financement (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  FinancingSourceController.restore
);

// Supprimer une source de financement - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  FinancingSourceController.delete
);

export default router;
