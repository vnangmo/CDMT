import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';

export class CommentController {
  /**
   * Create a new comment
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Non authentifié',
        });
        return;
      }

      const { documentType, documentId, content, commentType, parentId, isInternal } = req.body;

      if (!documentType || !documentId || !content) {
        res.status(400).json({
          status: 'error',
          message: 'documentType, documentId et content sont requis',
        });
        return;
      }

      const comment = await CommentService.create({
        documentType,
        documentId,
        content,
        commentType,
        parentId,
        createdBy: userId,
        isInternal,
      });

      res.status(201).json({
        status: 'success',
        message: 'Commentaire créé',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a comment
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Non authentifié',
        });
        return;
      }

      const { id } = req.params;
      const { content, isResolved } = req.body;

      const comment = await CommentService.update(id, userId, {
        content,
        isResolved,
      });

      res.json({
        status: 'success',
        message: 'Commentaire mis à jour',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a comment
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Non authentifié',
        });
        return;
      }

      const { id } = req.params;

      await CommentService.delete(id, userId);

      res.json({
        status: 'success',
        message: 'Commentaire supprimé',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comments for a document
   */
  static async getByDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentType, documentId } = req.params;
      const { includeInternal, onlyUnresolved } = req.query;

      const options = {
        includeInternal: includeInternal === 'true',
        onlyUnresolved: onlyUnresolved === 'true',
      };

      const comments = await CommentService.getByDocument(documentType, documentId, options);

      res.json({
        status: 'success',
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark comment as resolved
   */
  static async markResolved(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Non authentifié',
        });
        return;
      }

      const { id } = req.params;

      const comment = await CommentService.markResolved(id, userId);

      res.json({
        status: 'success',
        message: 'Commentaire marqué comme résolu',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reply to a comment
   */
  static async reply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Non authentifié',
        });
        return;
      }

      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        res.status(400).json({
          status: 'error',
          message: 'content est requis',
        });
        return;
      }

      const comment = await CommentService.reply(id, content, userId);

      res.status(201).json({
        status: 'success',
        message: 'Réponse ajoutée',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comment by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const comment = await CommentService.getById(id);

      res.json({
        status: 'success',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CommentController;
