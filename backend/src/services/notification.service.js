/**
 * Notification Service
 *
 * Business logic for in-app alert management.
 * - Save notifications to DB.
 * - Get user notifications (paginated).
 * - Mark as read (single or all).
 * - Get unread count.
 */
import Notification from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { PAGINATION } from "../utils/constants.js";
import logger from "../config/logger.js";

class NotificationService {
  /**
   * Save a notification to the database.
   */
  static async createNotification(data) {
    const { recipient, sender, type, title, message, refModel, refId } = data;

    const notification = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title,
      message,
      refModel: refModel || undefined,
      refId: refId || undefined,
    });

    logger.debug(`Notification saved for user ${recipient}: ${title}`);

    return notification;
  }

  /**
   * Get all notifications for a user (paginated).
   */
  static async getMyNotifications(userId, queryParams = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;
    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate("sender", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found or access denied");
    }

    return notification;
  }

  /**
   * Mark all notifications for a user as read.
   */
  static async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { message: "All notifications marked as read" };
  }

  /**
   * Get the count of unread notifications for a user.
   */
  static async getUnreadCount(userId) {
    const count = await Notification.countDocuments({ recipient: userId, isRead: false });
    return { unreadCount: count };
  }

  /**
   * Delete a notification.
   */
  static async deleteNotification(userId, notificationId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found or access denied");
    }

    return { message: "Notification deleted successfully" };
  }

  /**
   * Clear all notifications for a user.
   */
  static async clearAll(userId) {
    await Notification.deleteMany({ recipient: userId });
    return { message: "All notifications cleared" };
  }
}

export default NotificationService;
