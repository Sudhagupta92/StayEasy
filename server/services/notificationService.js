import { Notification } from '../models/index.js';
import { NOTIFICATION_PRIORITY } from '../constants/roles.js';

export const notificationService = {
  /**
   * Fail-safe method to trigger a notification for a user.
   * Internal try-catch ensures that business transactions (bookings, payments) never fail if notification fails.
   */
  notifyUser: async ({
    userId,
    type,
    title,
    message,
    relatedEntity = null,
    actionUrl = '',
    priority = NOTIFICATION_PRIORITY.MEDIUM,
  }) => {
    try {
      if (!userId || !type || !title || !message) {
        console.warn('[Notification Service] Missing required fields for notification');
        return null;
      }

      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedEntity,
        actionUrl,
        priority,
      });

      return notification;
    } catch (error) {
      console.warn('[Notification Service Warning] Failed to dispatch notification:', error.message);
      return null;
    }
  },

  /**
   * Retrieve paginated notifications for a specific user
   */
  getUserNotifications: async (userId, params = {}) => {
    const page = parseInt(params.page, 10) || 1;
    const limit = parseInt(params.limit, 10) || 20;
    const unreadOnly = params.unreadOnly === 'true' || params.unreadOnly === true;
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get unread notification count for badge
   */
  getUnreadCount: async (userId) => {
    return await Notification.countDocuments({ userId, isRead: false });
  },

  /**
   * Mark a single notification as read for a user
   */
  markAsRead: async (userId, notificationId) => {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) return null;

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }
    return notification;
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId) => {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return result;
  },

  /**
   * Delete a notification belonging to a user
   */
  deleteNotification: async (userId, notificationId) => {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    return result;
  },
};

export default notificationService;
