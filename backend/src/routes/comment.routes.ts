import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Create a comment
router.post(
  '/',
  authenticate,
  CommentController.create
);

// Update a comment
router.put(
  '/:id',
  authenticate,
  CommentController.update
);

// Delete a comment
router.delete(
  '/:id',
  authenticate,
  CommentController.delete
);

// Get comments for a document
router.get(
  '/:documentType/:documentId',
  authenticate,
  CommentController.getByDocument
);

// Mark comment as resolved
router.post(
  '/:id/resolve',
  authenticate,
  CommentController.markResolved
);

// Reply to a comment
router.post(
  '/:id/reply',
  authenticate,
  CommentController.reply
);

// Get comment by ID
router.get(
  '/:id',
  authenticate,
  CommentController.getById
);

export default router;
