import prisma from '../config/database';
import EmailService from './email.service';
import { Notification } from '@prisma/client';
import { config } from '../config/config';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

interface WorkflowNotificationParams {
  documentType: string;
  documentId: string;
  newStatus: string;
  actionByUserId?: string;
  comment?: string;
  rejectionReason?: string;
}

interface CommentMentionParams {
  mentionedUserId: string;
  mentionedByUserId: string;
  documentType: string;
  documentId: string;
  documentCode: string;
  commentText: string;
}

interface PendingDocumentParams {
  documentType: string;
  documentId: string;
  documentCode: string;
  daysWaiting: number;
  creatorId: string;
  assignedReviewerId?: string;
}

// Document type to model name mapping
const DOCUMENT_TYPE_TO_MODEL: Record<string, string> = {
  'SectoralMeasure': 'sectoralMeasure',
  'ActionPlan': 'actionPlan',
  'MacroFramework': 'macroFramework',
  'RevenueProjection': 'revenueProjection',
  'ExpenseProjection': 'expenseProjection',
  'CBMTDocument': 'cBMTDocument',
  'TrendBudgetConfig': 'trendBudgetConfig',
  'CDMTGlobalScenario': 'cDMTGlobalScenario',
};

/**
 * Notification Service
 *
 * Orchestrates in-app and email notifications for workflow events,
 * comments, mentions, and reminders.
 */
class NotificationService {
  /**
   * Create a single in-app notification
   */
  static async create(params: CreateNotificationParams): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
        isRead: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log('[NotificationService] Created notification:', {
      id: notification.id,
      userId: params.userId,
      type: params.type,
    });

    return notification;
  }

  /**
   * Create multiple notifications in batch
   */
  static async createBatch(notifications: CreateNotificationParams[]): Promise<Notification[]> {
    if (notifications.length === 0) {
      return [];
    }

    const created = await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: false,
      })),
    });

    console.log(`[NotificationService] Created ${created.count} notifications in batch`);

    // Fetch the created notifications
    const userIds = [...new Set(notifications.map(n => n.userId))];
    return prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        createdAt: { gte: new Date(Date.now() - 5000) }, // Last 5 seconds
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Send workflow transition notification (in-app + email)
   */
  static async notifyWorkflowTransition(params: WorkflowNotificationParams): Promise<void> {
    try {
      console.log('[NotificationService] Processing workflow notification:', {
        documentType: params.documentType,
        documentId: params.documentId,
        newStatus: params.newStatus,
      });

      // Get document details
      const document = await this.getDocumentDetails(params.documentType, params.documentId);
      if (!document) {
        console.error('[NotificationService] Document not found:', params);
        return;
      }

      // Get action performer details
      let actionByUser = null;
      if (params.actionByUserId) {
        actionByUser = await prisma.user.findUnique({
          where: { id: params.actionByUserId },
          select: { id: true, email: true, firstName: true, lastName: true },
        });
      }

      // Determine recipients based on status transition
      const recipients = await this.getNotificationRecipients(
        params.documentType,
        params.documentId,
        params.newStatus,
        document
      );

      if (recipients.length === 0) {
        console.warn('[NotificationService] No recipients found for notification');
        return;
      }

      // Get status labels
      const statusLabels: Record<string, string> = {
        SUBMITTED: 'soumis',
        UNDER_REVIEW: 'en cours de révision',
        VALIDATED: 'validé',
        APPROVED: 'approuvé',
        REJECTED: 'rejeté',
        DRAFT: 'retourné au brouillon',
      };

      const statusLabel = statusLabels[params.newStatus] || params.newStatus;
      const documentLink = `${config.urls.frontend}/documents/${params.documentType.toLowerCase()}/${params.documentId}`;

      // Create in-app notifications
      const notifications: CreateNotificationParams[] = recipients.map(recipient => ({
        userId: recipient.id,
        title: `Document ${statusLabel}`,
        message: `Le document ${document.code || params.documentId} a été ${statusLabel}${actionByUser ? ` par ${actionByUser.firstName} ${actionByUser.lastName}` : ''}.`,
        type: `WORKFLOW_${params.newStatus}`,
        link: documentLink,
      }));

      await this.createBatch(notifications);

      // Send emails to all recipients
      const emailPromises = recipients.map(recipient =>
        EmailService.sendWorkflowNotification({
          to: recipient.email,
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          documentType: params.documentType,
          documentCode: document.code || params.documentId,
          documentLink,
          actionBy: actionByUser ? `${actionByUser.firstName} ${actionByUser.lastName}` : 'Système',
          actionDate: new Date(),
          status: statusLabel,
          comment: params.comment,
          rejectionReason: params.rejectionReason,
        })
      );

      await Promise.allSettled(emailPromises);

      console.log(`[NotificationService] Workflow notification sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('[NotificationService] Error in notifyWorkflowTransition:', error);
    }
  }

  /**
   * Send comment mention notification
   */
  static async notifyCommentMention(params: CommentMentionParams): Promise<void> {
    try {
      const mentionedUser = await prisma.user.findUnique({
        where: { id: params.mentionedUserId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      const mentionedByUser = await prisma.user.findUnique({
        where: { id: params.mentionedByUserId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!mentionedUser || !mentionedByUser) {
        console.error('[NotificationService] User not found for mention notification');
        return;
      }

      const documentLink = `${config.urls.frontend}/documents/${params.documentType.toLowerCase()}/${params.documentId}`;

      // Create in-app notification
      await this.create({
        userId: params.mentionedUserId,
        title: 'Vous avez été mentionné',
        message: `${mentionedByUser.firstName} ${mentionedByUser.lastName} vous a mentionné dans ${params.documentCode}`,
        type: 'MENTION',
        link: documentLink,
      });

      // Send email
      await EmailService.sendMentionNotification({
        to: mentionedUser.email,
        recipientName: `${mentionedUser.firstName} ${mentionedUser.lastName}`,
        mentionedBy: `${mentionedByUser.firstName} ${mentionedByUser.lastName}`,
        documentType: params.documentType,
        documentCode: params.documentCode,
        commentText: params.commentText,
        documentLink,
      });

      console.log('[NotificationService] Mention notification sent');
    } catch (error) {
      console.error('[NotificationService] Error in notifyCommentMention:', error);
    }
  }

  /**
   * Send comment reply notification
   */
  static async notifyCommentReply(params: CommentMentionParams): Promise<void> {
    try {
      const recipientUser = await prisma.user.findUnique({
        where: { id: params.mentionedUserId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      const replierUser = await prisma.user.findUnique({
        where: { id: params.mentionedByUserId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!recipientUser || !replierUser) {
        console.error('[NotificationService] User not found for reply notification');
        return;
      }

      const documentLink = `${config.urls.frontend}/documents/${params.documentType.toLowerCase()}/${params.documentId}`;

      // Create in-app notification
      await this.create({
        userId: params.mentionedUserId,
        title: 'Nouvelle réponse à votre commentaire',
        message: `${replierUser.firstName} ${replierUser.lastName} a répondu à votre commentaire dans ${params.documentCode}`,
        type: 'REPLY',
        link: documentLink,
      });

      // Send email
      await EmailService.sendReplyNotification({
        to: recipientUser.email,
        recipientName: `${recipientUser.firstName} ${recipientUser.lastName}`,
        mentionedBy: `${replierUser.firstName} ${replierUser.lastName}`,
        documentType: params.documentType,
        documentCode: params.documentCode,
        commentText: params.commentText,
        documentLink,
      });

      console.log('[NotificationService] Reply notification sent');
    } catch (error) {
      console.error('[NotificationService] Error in notifyCommentReply:', error);
    }
  }

  /**
   * Send reminder for pending document
   */
  static async notifyPendingDocument(params: PendingDocumentParams): Promise<void> {
    try {
      const documentLink = `${config.urls.frontend}/documents/${params.documentType.toLowerCase()}/${params.documentId}`;

      // Notify creator
      const creator = await prisma.user.findUnique({
        where: { id: params.creatorId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (creator) {
        await this.create({
          userId: creator.id,
          title: `Rappel: Document en attente (${params.daysWaiting} jours)`,
          message: `Le document ${params.documentCode} est en attente de validation depuis ${params.daysWaiting} jours.`,
          type: 'REMINDER_PENDING',
          link: documentLink,
        });

        await EmailService.sendReminder({
          to: creator.email,
          recipientName: `${creator.firstName} ${creator.lastName}`,
          documentType: params.documentType,
          documentCode: params.documentCode,
          daysWaiting: params.daysWaiting,
          documentLink,
        });
      }

      // Notify assigned reviewer if exists
      if (params.assignedReviewerId) {
        const reviewer = await prisma.user.findUnique({
          where: { id: params.assignedReviewerId },
          select: { id: true, email: true, firstName: true, lastName: true },
        });

        if (reviewer) {
          await this.create({
            userId: reviewer.id,
            title: `Rappel: Document à valider (${params.daysWaiting} jours)`,
            message: `Le document ${params.documentCode} attend votre validation depuis ${params.daysWaiting} jours.`,
            type: 'REMINDER_VALIDATION',
            link: documentLink,
          });

          await EmailService.sendReminder({
            to: reviewer.email,
            recipientName: `${reviewer.firstName} ${reviewer.lastName}`,
            documentType: params.documentType,
            documentCode: params.documentCode,
            daysWaiting: params.daysWaiting,
            documentLink,
          });
        }
      }

      console.log('[NotificationService] Pending document reminder sent');
    } catch (error) {
      console.error('[NotificationService] Error in notifyPendingDocument:', error);
    }
  }

  /**
   * Get user notifications with filters
   */
  static async getUserNotifications(
    userId: string,
    filters?: {
      isRead?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const where: any = { userId };

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    try {
      return await prisma.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
      return null;
    }
  }

  /**
   * Mark notification as unread
   */
  static async markAsUnread(notificationId: string, userId: string): Promise<Notification | null> {
    try {
      return await prisma.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
        data: {
          isRead: false,
          readAt: null,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Error marking notification as unread:', error);
      return null;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Delete a notification
   */
  static async delete(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get document details from any document type
   */
  private static async getDocumentDetails(documentType: string, documentId: string): Promise<any> {
    const modelName = DOCUMENT_TYPE_TO_MODEL[documentType];
    if (!modelName) {
      console.error(`[NotificationService] Unknown document type: ${documentType}`);
      return null;
    }

    try {
      // @ts-ignore - Dynamic model access
      return await prisma[modelName].findUnique({
        where: { id: documentId },
      });
    } catch (error) {
      console.error('[NotificationService] Error fetching document:', error);
      return null;
    }
  }

  /**
   * Determine notification recipients based on workflow status
   */
  private static async getNotificationRecipients(
    documentType: string,
    documentId: string,
    newStatus: string,
    document: any
  ): Promise<Array<{ id: string; email: string; firstName: string; lastName: string }>> {
    const recipients: Set<string> = new Set();

    try {
      // Always notify document creator
      if (document.createdBy) {
        recipients.add(document.createdBy);
      }

      // Status-specific logic
      switch (newStatus) {
        case 'SUBMITTED':
        case 'UNDER_REVIEW':
          // Notify reviewers and validators
          const reviewers = await this.getReviewersForDocumentType(documentType, document.ministryId);
          reviewers.forEach(r => recipients.add(r.id));
          break;

        case 'VALIDATED':
          // Notify approvers and document creator
          const approvers = await this.getApproversForDocumentType(documentType, document.ministryId);
          approvers.forEach(a => recipients.add(a.id));
          break;

        case 'APPROVED':
          // Notify all stakeholders
          const stakeholders = await this.getStakeholdersForDocument(documentType, documentId);
          stakeholders.forEach(s => recipients.add(s.id));
          break;

        case 'REJECTED':
        case 'DRAFT':
          // Only notify document creator (already added above)
          break;
      }

      // Fetch full user details
      const userIds = Array.from(recipients);
      if (userIds.length === 0) {
        return [];
      }

      return await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Error determining recipients:', error);
      return [];
    }
  }

  /**
   * Get reviewers for a document type and ministry
   */
  private static async getReviewersForDocumentType(
    documentType: string,
    ministryId?: string
  ): Promise<Array<{ id: string }>> {
    try {
      // Get users with REVIEWER or VALIDATOR roles
      const reviewerRoles = await prisma.role.findMany({
        where: {
          name: { in: ['REVIEWER', 'VALIDATOR', 'DIRECTOR'] },
        },
        select: { id: true },
      });

      const roleIds = reviewerRoles.map(r => r.id);

      const users = await prisma.user.findMany({
        where: {
          roleId: { in: roleIds },
          ...(ministryId && { ministryId }),
        },
        select: { id: true },
      });

      return users;
    } catch (error) {
      console.error('[NotificationService] Error fetching reviewers:', error);
      return [];
    }
  }

  /**
   * Get approvers for a document type and ministry
   */
  private static async getApproversForDocumentType(
    documentType: string,
    ministryId?: string
  ): Promise<Array<{ id: string }>> {
    try {
      // Get users with APPROVER or DIRECTOR roles
      const approverRoles = await prisma.role.findMany({
        where: {
          name: { in: ['APPROVER', 'DIRECTOR', 'ADMIN'] },
        },
        select: { id: true },
      });

      const roleIds = approverRoles.map(r => r.id);

      const users = await prisma.user.findMany({
        where: {
          roleId: { in: roleIds },
          ...(ministryId && { ministryId }),
        },
        select: { id: true },
      });

      return users;
    } catch (error) {
      console.error('[NotificationService] Error fetching approvers:', error);
      return [];
    }
  }

  /**
   * Get stakeholders for a specific document
   */
  private static async getStakeholdersForDocument(
    documentType: string,
    documentId: string
  ): Promise<Array<{ id: string }>> {
    try {
      // This could be expanded to include:
      // - Users who commented on the document
      // - Users assigned to the document
      // - Users in the same ministry
      // For now, return empty array (only creator gets notified via main logic)
      return [];
    } catch (error) {
      console.error('[NotificationService] Error fetching stakeholders:', error);
      return [];
    }
  }
}

export default NotificationService;
