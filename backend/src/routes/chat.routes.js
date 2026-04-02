/**
 * Chat Routes
 *
 * REST endpoints for chat operations.
 * All routes require authentication.
 *
 * GET    /api/v1/chat/rooms                     - Get all chat rooms
 * GET    /api/v1/chat/rooms/:roomId             - Get chat room details
 * GET    /api/v1/chat/rooms/:roomId/messages    - Get message history
 * POST   /api/v1/chat/rooms/:roomId/messages    - Send message (REST fallback)
 * PATCH  /api/v1/chat/rooms/:roomId/read        - Mark messages as read
 * GET    /api/v1/chat/unread-count              - Get total unread count
 * DELETE /api/v1/chat/messages/:messageId       - Delete a message
 */
import { Router } from "express";

import ChatController from "../controllers/chat.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";

import {
  sendMessageSchema,
  chatRoomsQuerySchema,
  messagesQuerySchema,
} from "../validations/chat.validation.js";

const router = Router();

// All chat routes require authentication
router.use(isAuthenticated);

// Static routes first
router.get("/unread-count", ChatController.getTotalUnreadCount);
router.delete("/messages/:messageId", ChatController.deleteMessage);

// Chat rooms
router.get("/rooms", validateQuery(chatRoomsQuerySchema), ChatController.getMyChatRooms);
router.get("/rooms/:roomId", ChatController.getChatRoomDetails);

// Messages within a room
router.get("/rooms/:roomId/messages", validateQuery(messagesQuerySchema), ChatController.getMessages);
router.post("/rooms/:roomId/messages", validate(sendMessageSchema), ChatController.sendMessage);
router.patch("/rooms/:roomId/read", ChatController.markAsRead);

export default router;
