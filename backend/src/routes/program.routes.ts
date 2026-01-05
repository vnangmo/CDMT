import { Router } from 'express';
import { ProgramController } from '../controllers/program.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes pour la gestion de la structure programmatique (programmes, actions, activités)
 * Toutes les routes nécessitent une authentification
 */

// ==================== STATISTIQUES ====================

// Obtenir les statistiques (REF:READ requis)
router.get(
  '/stats',
  authenticate,
  authorize(['REF:READ']),
  ProgramController.getStats
);

// ==================== PROGRAMMES ====================

// Obtenir tous les programmes (REF:READ requis)
router.get(
  '/programs',
  authenticate,
  authorize(['REF:READ']),
  ProgramController.getAllPrograms
);

// Obtenir un programme par ID (REF:READ requis)
router.get(
  '/programs/:id',
  authenticate,
  authorize(['REF:READ']),
  ProgramController.getProgramById
);

// Créer un programme (REF:CREATE requis)
router.post(
  '/programs',
  authenticate,
  authorize(['REF:CREATE']),
  ProgramController.createProgram
);

// Mettre à jour un programme (REF:UPDATE requis)
router.put(
  '/programs/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  ProgramController.updateProgram
);

// Supprimer un programme - soft delete (REF:DELETE requis)
router.delete(
  '/programs/:id',
  authenticate,
  authorize(['REF:DELETE']),
  ProgramController.deleteProgram
);

// ==================== ACTIONS ====================

// Obtenir toutes les actions (REF:READ requis)
router.get(
  '/actions',
  authenticate,
  authorize(['REF:READ']),
  ProgramController.getAllActions
);

// Obtenir une action par ID (REF:READ requis)
router.get(
  '/actions/:id',
  authenticate,
  authorize(['REF:READ']),
  ProgramController.getActionById
);

// Créer une action (REF:CREATE requis)
router.post(
  '/actions',
  authenticate,
  authorize(['REF:CREATE']),
  ProgramController.createAction
);

// Mettre à jour une action (REF:UPDATE requis)
router.put(
  '/actions/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  ProgramController.updateAction
);

// Supprimer une action - soft delete (REF:DELETE requis)
router.delete(
  '/actions/:id',
  authenticate,
  authorize(['REF:DELETE']),
  ProgramController.deleteAction
);

// ==================== ACTIVITÉS ====================

// Obtenir toutes les activités (REF:READ requis)
router.get(
  '/activities',
  authenticate,
  authorize(['REF:READ']),
  ProgramController.getAllActivities
);

// Obtenir une activité par ID (REF:READ requis)
router.get(
  '/activities/:id',
  authenticate,
  authorize(['REF:READ']),
  ProgramController.getActivityById
);

// Créer une activité (REF:CREATE requis)
router.post(
  '/activities',
  authenticate,
  authorize(['REF:CREATE']),
  ProgramController.createActivity
);

// Mettre à jour une activité (REF:UPDATE requis)
router.put(
  '/activities/:id',
  authenticate,
  authorize(['REF:UPDATE']),
  ProgramController.updateActivity
);

// Supprimer une activité - soft delete (REF:DELETE requis)
router.delete(
  '/activities/:id',
  authenticate,
  authorize(['REF:DELETE']),
  ProgramController.deleteActivity
);

export default router;
