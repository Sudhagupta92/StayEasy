import apiClient from './api';

export const notificationService = {
  /**
   * Get user notifications
   */
  getNotifications: async (params = {}) => {
    return await apiClient.get('/notifications', { params });
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    return await apiClient.get('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id) => {
    return await apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    return await apiClient.patch('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id) => {
    return await apiClient.delete(`/notifications/${id}`);
  },
};

export default notificationService;
