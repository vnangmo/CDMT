import { Router } from 'express';
import { FiscalYearController } from '../controllers/fiscalYear.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des années fiscales
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  FiscalYearController.getStats
);

// Obtenir toutes les années fiscales (REF:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  FiscalYearController.getAll
);

// Obtenir une année fiscale par année (REF:READ requis)
router.get(
  '/year/:year',
  authenticate,
  authorize(['REF:READ']),
  FiscalYearController.getByYear
);

// Obtenir une année fiscale par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  FiscalYearController.getById
);

// Créer une année fiscale (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  FiscalYearController.create
);

// Mettre à jour une année fiscale (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  FiscalYearController.update
);

// Clôturer une année fiscale (REF:UPDATE requis)
router.patch(
  '/:id/close',
  authenticate,
  authorize(['REF:UPDATE']),
  FiscalYearController.close
);

// Rouvrir une année fiscale (REF:UPDATE requis)
router.patch(
  '/:id/reopen',
  authenticate,
  authorize(['REF:UPDATE']),
  FiscalYearController.reopen
);

// Restaurer une année fiscale (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  FiscalYearController.restore
);

// Supprimer une année fiscale - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  FiscalYearController.delete
);

export default router;
