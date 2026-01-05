import { Router } from 'express';
import { BudgetYearController } from '../controllers/budgetYear.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/budget-years
 * @desc    Obtenir toutes les années budgétaires
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  BudgetYearController.getAll
);

/**
 * @route   GET /api/v1/budget-years/stats
 * @desc    Obtenir les statistiques des années budgétaires
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/stats',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  BudgetYearController.getStats
);

/**
 * @route   GET /api/v1/budget-years/current
 * @desc    Obtenir l'année budgétaire courante
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/current',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  BudgetYearController.getCurrentYear
);

/**
 * @route   GET /api/v1/budget-years/year/:year
 * @desc    Obtenir une année budgétaire par année
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/year/:year',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  BudgetYearController.getByYear
);

/**
 * @route   GET /api/v1/budget-years/:id
 * @desc    Obtenir une année budgétaire par ID
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/:id',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  BudgetYearController.getById
);

/**
 * @route   POST /api/v1/budget-years
 * @desc    Créer une année budgétaire
 * @access  Private (BUDGET:CREATE)
 */
router.post(
  '/',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  BudgetYearController.create
);

/**
 * @route   PUT /api/v1/budget-years/:id
 * @desc    Mettre à jour une année budgétaire
 * @access  Private (BUDGET:UPDATE)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['BUDGET:UPDATE', 'ADMIN:UPDATE']),
  BudgetYearController.update
);

/**
 * @route   PATCH /api/v1/budget-years/:id/set-current
 * @desc    Définir une année comme année courante
 * @access  Private (BUDGET:UPDATE)
 */
router.patch(
  '/:id/set-current',
  authenticate,
  authorize(['BUDGET:UPDATE', 'ADMIN:UPDATE']),
  BudgetYearController.setAsCurrent
);

/**
 * @route   PATCH /api/v1/budget-years/:id/activate
 * @desc    Activer une année budgétaire
 * @access  Private (BUDGET:UPDATE)
 */
router.patch(
  '/:id/activate',
  authenticate,
  authorize(['BUDGET:UPDATE', 'ADMIN:UPDATE']),
  BudgetYearController.activate
);

/**
 * @route   PATCH /api/v1/budget-years/:id/close
 * @desc    Clôturer une année budgétaire
 * @access  Private (BUDGET:UPDATE)
 */
router.patch(
  '/:id/close',
  authenticate,
  authorize(['BUDGET:UPDATE', 'ADMIN:UPDATE']),
  BudgetYearController.close
);

/**
 * @route   DELETE /api/v1/budget-years/:id
 * @desc    Supprimer une année budgétaire
 * @access  Private (BUDGET:DELETE)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['BUDGET:DELETE', 'ADMIN:DELETE']),
  BudgetYearController.delete
);

export default router;
