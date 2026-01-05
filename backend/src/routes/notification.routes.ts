import { Router } from 'express';
import NotificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/notifications
 * Get user notifications with optional filters
 * Query params: isRead (boolean), type (string), limit (number), offset (number)
 */
router.get('/', NotificationController.getUserNotifications);

/**
 * GET /api/v1/notifications/unread-count
 * Get count of unread notifications for the current user
 */
router.get('/unread-count', NotificationController.getUnreadCount);

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
router.post('/mark-all-read', NotificationController.markAllAsRead);

/**
 * POST /api/v1/notifications/:id/read
 * Mark a specific notification as read
 */
router.post('/:id/read', NotificationController.markAsRead);

/**
 * POST /api/v1/notifications/:id/unread
 * Mark a specific notification as unread
 */
router.post('/:id/unread', NotificationController.markAsUnread);

/**
 * DELETE /api/v1/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', NotificationController.delete);

export default router;
