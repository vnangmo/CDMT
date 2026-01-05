import { Router } from 'express';
import { FundingSourceController } from '../controllers/fundingSource.controller';
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
  FundingSourceController.getStats
);

// Obtenir toutes les sources de financement (REF:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  FundingSourceController.getAll
);

// Obtenir une source de financement par code (REF:READ requis)
router.get(
  '/code/:code',
  authenticate,
  authorize(['REF:READ']),
  FundingSourceController.getByCode
);

// Obtenir une source de financement par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  FundingSourceController.getById
);

// Créer une source de financement (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  FundingSourceController.create
);

// Mettre à jour une source de financement (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  FundingSourceController.update
);

// Restaurer une source de financement (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  FundingSourceController.restore
);

// Supprimer une source de financement - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  FundingSourceController.delete
);

export default router;
