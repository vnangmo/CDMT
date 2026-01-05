import { Router } from 'express';
import { MinistryController } from '../controllers/ministry.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { setCacheHeaders } from '../middleware/cacheHeaders';
import {
  validateCreateMinistry,
  validateUpdateMinistry,
  validateUuidParam,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * Routes pour la gestion des ministères
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  MinistryController.getStats
);

// Obtenir tous les ministères (REF:READ requis)
// Cache: 1 hour (reference data changes infrequently)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  setCacheHeaders(3600),
  MinistryController.getAll
);

// Obtenir un ministère par code (REF:READ requis)
router.get(
  '/code/:code',
  authenticate,
  authorize(['REF:READ']),
  MinistryController.getByCode
);

// Obtenir un ministère par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  ...validateUuidParam('id'),
  MinistryController.getById
);

// Créer un ministère (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  validateCreateMinistry,
  MinistryController.create
);

// Mettre à jour un ministère (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  validateUpdateMinistry,
  MinistryController.update
);

// Restaurer un ministère (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  MinistryController.restore
);

// Supprimer un ministère - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  MinistryController.delete
);

export default router;
