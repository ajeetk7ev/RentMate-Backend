/**
 * Notification Controller
 *
 * REST endpoints for managing user alerts.
 */
import NotificationService from "../services/notification.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class NotificationController {
  /**
   * GET /api/v1/notifications
   * List user notifications (paginated).
   */
  static getMyNotifications = asyncHandler(async (req, res) => {
    const result = await NotificationService.getMyNotifications(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Notifications fetched successfully"));
  });

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a notification as read.
   */
  static markAsRead = asyncHandler(async (req, res) => {
    const notification = await NotificationService.markAsRead(req.user._id, req.params.id);

    res
      .status(200)
      .json(new ApiResponse(200, { notification }, "Notification marked as read"));
  });

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read.
   */
  static markAllAsRead = asyncHandler(async (req, res) => {
    const result = await NotificationService.markAllAsRead(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "All notifications marked as read"));
  });

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notification count for the badge.
   */
  static getUnreadCount = asyncHandler(async (req, res) => {
    const result = await NotificationService.getUnreadCount(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Unread count fetched"));
  });

  /**
   * DELETE /api/v1/notifications/:id
   * Delete a single notification.
   */
  static deleteNotification = asyncHandler(async (req, res) => {
    const result = await NotificationService.deleteNotification(req.user._id, req.params.id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Notification deleted"));
  });

  /**
   * DELETE /api/v1/notifications/clear-all
   * Clear all user notifications.
   */
  static clearAll = asyncHandler(async (req, res) => {
    const result = await NotificationService.clearAll(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "All notifications cleared"));
  });
}

export default NotificationController;
