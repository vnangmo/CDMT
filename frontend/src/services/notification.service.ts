import api from '../config/api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationService {
  /**
   * Get user notifications with filters
   */
  async getUserNotifications(params?: {
    isRead?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.isRead !== undefined) {
      queryParams.append('isRead', params.isRead.toString());
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const response = await api.get(`/notifications?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(id: string): Promise<Notification> {
    const response = await api.post(`/notifications/${id}/unread`);
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number; message: string }> {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  }

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }
}

export default new NotificationService();
