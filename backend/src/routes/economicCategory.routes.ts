import { Router } from 'express';
import { EconomicCategoryController } from '../controllers/economicCategory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion des catégories économiques
 * Toutes les routes nécessitent une authentification
 */

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  EconomicCategoryController.getStats
);

// Obtenir l'arborescence (REF:READ requis)
router.get(
  '/tree',
  authenticate,
  authorize(['REF:READ']),
  EconomicCategoryController.getTree
);

// Obtenir toutes les catégories économiques (REF:READ requis)
router.get(
  '/',
  authenticate,
  authorize(['REF:READ']),
  EconomicCategoryController.getAll
);

// Obtenir une catégorie économique par code (REF:READ requis)
router.get(
  '/code/:code',
  authenticate,
  authorize(['REF:READ']),
  EconomicCategoryController.getByCode
);

// Obtenir une catégorie économique par ID (REF:READ requis)
router.get(
  '/:id',
  authenticate,
  authorize(['REF:READ']),
  EconomicCategoryController.getById
);

// Créer une catégorie économique (REF:CREATE requis)
router.post(
  '/',
  authenticate,
  authorize(['REF:CREATE']),
  EconomicCategoryController.create
);

// Mettre à jour une catégorie économique (REF:UPDATE requis)
router.put(
  '/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  EconomicCategoryController.update
);

// Restaurer une catégorie économique (REF:UPDATE requis)
router.patch(
  '/:id/restore',
  authenticate,
  authorize(['REF:UPDATE']),
  EconomicCategoryController.restore
);

// Supprimer une catégorie économique - soft delete (REF:DELETE requis)
router.delete(
  '/:id',
  authenticate,
  authorize(['REF:DELETE']),
  EconomicCategoryController.delete
);

export default router;
