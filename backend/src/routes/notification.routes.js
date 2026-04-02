/**
 * Notification Routes
 * 
 * GET /api/v1/notifications               - Get user notifications (paginated)
 * PATCH /api/v1/notifications/read-all    - Mark all as read
 * GET /api/v1/notifications/unread-count - Get unread count
 * PATCH /api/v1/notifications/:id/read   - Mark one as read
 * DELETE /api/v1/notifications/clear-all - Clear all notifications
 * DELETE /api/v1/notifications/:id        - Delete one notification
 */
import { Router } from "express";

import NotificationController from "../controllers/notification.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validateQuery } from "../middlewares/validate.middleware.js";

import {
  notificationListQuerySchema,
} from "../validations/notification.validation.js";

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// Static paths first
router.get("/", validateQuery(notificationListQuerySchema), NotificationController.getMyNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/read-all", NotificationController.markAllAsRead);
router.delete("/clear-all", NotificationController.clearAll);

// Parameterized paths
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export default router;
