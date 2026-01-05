import { PrismaClient, Comment, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class CommentService {
  /**
   * Create a new comment
   */
  static async create(data: {
    documentType: string;
    documentId: string;
    content: string;
    commentType?: string;
    parentId?: string;
    createdBy: string;
    isInternal?: boolean;
  }): Promise<Comment> {
    // If parentId is provided, verify parent exists
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new NotFoundError('Commentaire parent introuvable');
      }

      // Verify parent is for the same document
      if (parent.documentType !== data.documentType || parent.documentId !== data.documentId) {
        throw new BadRequestError('Le commentaire parent doit être pour le même document');
      }
    }

    return await prisma.comment.create({
      data: {
        documentType: data.documentType,
        documentId: data.documentId,
        content: data.content,
        commentType: data.commentType || 'GENERAL',
        parentId: data.parentId,
        createdBy: data.createdBy,
        isInternal: data.isInternal || false,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update a comment
   */
  static async update(
    id: string,
    userId: string,
    data: {
      content?: string;
      isResolved?: boolean;
    }
  ): Promise<Comment> {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundError('Commentaire introuvable');
    }

    // Only author can edit content
    if (data.content && comment.createdBy !== userId) {
      throw new BadRequestError('Seul l\'auteur peut modifier le contenu du commentaire');
    }

    const updateData: Prisma.CommentUpdateInput = {};

    if (data.content) {
      updateData.content = data.content;
      updateData.isEdited = true;
    }

    if (data.isResolved !== undefined) {
      updateData.isResolved = data.isResolved;
      if (data.isResolved) {
        updateData.resolvedBy = userId;
        updateData.resolvedAt = new Date();
      } else {
        updateData.resolvedBy = null;
        updateData.resolvedAt = null;
      }
    }

    return await prisma.comment.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete a comment
   */
  static async delete(id: string, userId: string): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      throw new NotFoundError('Commentaire introuvable');
    }

    // Only author can delete
    if (comment.createdBy !== userId) {
      throw new BadRequestError('Seul l\'auteur peut supprimer le commentaire');
    }

    // If has replies, prevent deletion
    if (comment.replies && comment.replies.length > 0) {
      throw new BadRequestError('Impossible de supprimer un commentaire avec des réponses');
    }

    await prisma.comment.delete({
      where: { id },
    });
  }

  /**
   * Get comments for a document
   */
  static async getByDocument(
    documentType: string,
    documentId: string,
    options?: {
      includeInternal?: boolean;
      onlyUnresolved?: boolean;
    }
  ): Promise<Comment[]> {
    const where: Prisma.CommentWhereInput = {
      documentType,
      documentId,
      parentId: null, // Only get top-level comments
    };

    if (options?.includeInternal === false) {
      where.isInternal = false;
    }

    if (options?.onlyUnresolved) {
      where.isResolved = false;
    }

    return await prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Mark comment as resolved
   */
  static async markResolved(id: string, userId: string): Promise<Comment> {
    return await this.update(id, userId, { isResolved: true });
  }

  /**
   * Reply to a comment
   */
  static async reply(
    parentId: string,
    content: string,
    userId: string
  ): Promise<Comment> {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundError('Commentaire parent introuvable');
    }

    return await this.create({
      documentType: parent.documentType,
      documentId: parent.documentId,
      content,
      commentType: 'GENERAL',
      parentId,
      createdBy: userId,
      isInternal: parent.isInternal,
    });
  }

  /**
   * Get comment by ID
   */
  static async getById(id: string): Promise<Comment> {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundError('Commentaire introuvable');
    }

    return comment;
  }
}

export default CommentService;
