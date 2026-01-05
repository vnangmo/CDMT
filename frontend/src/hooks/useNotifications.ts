import { useState, useEffect, useCallback, useRef } from 'react';
import notificationService, { Notification } from '../services/notification.service';

const POLLING_INTERVAL = 30000; // 30 seconds

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export const useNotifications = (options?: {
  isRead?: boolean;
  autoRefresh?: boolean;
  limit?: number;
}): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.getUserNotifications({
        isRead: options?.isRead,
        limit: options?.limit || 50,
      });

      setNotifications(response.notifications);
    } catch (err: any) {
      console.error('[useNotifications] Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [options?.isRead, options?.limit]);

  /**
   * Refresh unread count
   */
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('[useNotifications] Error fetching unread count:', err);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );

      // Refresh unread count
      await refreshUnreadCount();
    } catch (err: any) {
      console.error('[useNotifications] Error marking as read:', err);
      throw err;
    }
  }, [refreshUnreadCount]);

  /**
   * Mark notification as unread
   */
  const markAsUnread = useCallback(async (id: string) => {
    try {
      await notificationService.markAsUnread(id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: false, readAt: undefined } : n))
      );

      // Refresh unread count
      await refreshUnreadCount();
    } catch (err: any) {
      console.error('[useNotifications] Error marking as unread:', err);
      throw err;
    }
  }, [refreshUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );

      // Refresh unread count
      setUnreadCount(0);
    } catch (err: any) {
      console.error('[useNotifications] Error marking all as read:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.delete(id);

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id));

      // Refresh unread count if it was unread
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.isRead) {
        await refreshUnreadCount();
      }
    } catch (err: any) {
      console.error('[useNotifications] Error deleting notification:', err);
      throw err;
    }
  }, [notifications, refreshUnreadCount]);

  /**
   * Setup polling for real-time updates
   */
  useEffect(() => {
    if (options?.autoRefresh !== false) {
      // Initial fetch
      fetchNotifications();
      refreshUnreadCount();

      // Setup polling
      intervalRef.current = setInterval(() => {
        fetchNotifications();
        refreshUnreadCount();
      }, POLLING_INTERVAL);

      // Cleanup
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchNotifications, refreshUnreadCount, options?.autoRefresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
  };
};
