import { Request, Response, NextFunction } from 'express';
import NotificationService from '../services/notification.service';

/**
 * Notification Controller
 *
 * Handles HTTP requests for notification management
 */
class NotificationController {
  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  static async getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore - req.user is added by authentication middleware
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { isRead, type, limit, offset } = req.query;

      const result = await NotificationService.getUserNotifications(userId, {
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        type: type as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await NotificationService.getUnreadCount(userId);

      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * POST /api/v1/notifications/:id/read
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const notification = await NotificationService.markAsRead(id, userId);

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as unread
   * POST /api/v1/notifications/:id/unread
   */
  static async markAsUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const notification = await NotificationService.markAsUnread(id, userId);

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * POST /api/v1/notifications/mark-all-read
   */
  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await NotificationService.markAllAsRead(userId);

      res.json({ count, message: `${count} notifications marked as read` });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * DELETE /api/v1/notifications/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const success = await NotificationService.delete(id, userId);

      if (!success) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
