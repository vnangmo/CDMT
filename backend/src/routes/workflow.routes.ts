import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Get workflow history for a document
router.get(
  '/history/:documentType/:documentId',
  authenticate,
  WorkflowController.getHistory
);

// Get pending reviews for current user
router.get(
  '/pending-reviews',
  authenticate,
  WorkflowController.getPendingReviews
);

// Get workflow statistics
router.get(
  '/stats',
  authenticate,
  WorkflowController.getStats
);

// Check if document can be edited
router.get(
  '/can-edit/:documentType/:documentId',
  authenticate,
  WorkflowController.canEdit
);

// Check if document is in final state
router.get(
  '/is-final/:documentType/:documentId',
  authenticate,
  WorkflowController.isFinal
);

export default router;
