import { notificationService } from '../services/notificationService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get current authenticated user's notifications
 * @route   GET /api/v1/notifications
 * @access  Private (Authenticated)
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getUserNotifications(req.user._id, req.query);
    return successResponse(res, 'Notifications retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count for authenticated user
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private (Authenticated)
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user._id);
    return successResponse(res, 'Unread notification count retrieved', { unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private (Authenticated)
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user._id, req.params.id);
    if (!notification) {
      return errorResponse(res, 'Notification not found or unauthorized', 404);
    }
    return successResponse(res, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read for current user
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private (Authenticated)
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return successResponse(res, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private (Authenticated)
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.user._id, req.params.id);
    if (!result) {
      return errorResponse(res, 'Notification not found or unauthorized', 404);
    }
    return successResponse(res, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};
