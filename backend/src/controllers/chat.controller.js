/**
 * Chat Controller
 *
 * REST endpoints for chat operations.
 * Real-time messaging is handled via Socket.IO (chat.handler.js).
 * These endpoints provide fallback and initial data loading.
 */
import ChatService from "../services/chat.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class ChatController {
  /**
   * GET /api/v1/chat/rooms
   * Get all chat rooms for the current user
   */
  static getMyChatRooms = asyncHandler(async (req, res) => {
    const result = await ChatService.getMyChatRooms(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Chat rooms fetched successfully"));
  });

  /**
   * GET /api/v1/chat/rooms/:roomId
   * Get chat room details
   */
  static getChatRoomDetails = asyncHandler(async (req, res) => {
    const chatRoom = await ChatService.getChatRoomDetails(req.user._id, req.params.roomId);

    res
      .status(200)
      .json(new ApiResponse(200, { chatRoom }, "Chat room details fetched"));
  });

  /**
   * GET /api/v1/chat/rooms/:roomId/messages
   * Get message history for a chat room
   */
  static getMessages = asyncHandler(async (req, res) => {
    const result = await ChatService.getMessages(
      req.user._id,
      req.params.roomId,
      req.query
    );

    res
      .status(200)
      .json(new ApiResponse(200, result, "Messages fetched successfully"));
  });

  /**
   * POST /api/v1/chat/rooms/:roomId/messages
   * Send a message (REST fallback — prefer Socket.IO for real-time)
   */
  static sendMessage = asyncHandler(async (req, res) => {
    const message = await ChatService.sendMessage(req.user._id, {
      chatRoomId: req.params.roomId,
      content: req.body.content,
      type: req.body.type || "text",
    });

    res
      .status(201)
      .json(new ApiResponse(201, { message }, "Message sent successfully"));
  });

  /**
   * PATCH /api/v1/chat/rooms/:roomId/read
   * Mark all messages as read in a chat room
   */
  static markAsRead = asyncHandler(async (req, res) => {
    const result = await ChatService.markMessagesAsRead(req.user._id, req.params.roomId);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Messages marked as read"));
  });

  /**
   * GET /api/v1/chat/unread-count
   * Get total unread message count across all rooms
   */
  static getTotalUnreadCount = asyncHandler(async (req, res) => {
    const result = await ChatService.getTotalUnreadCount(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Unread count fetched"));
  });

  /**
   * DELETE /api/v1/chat/messages/:messageId
   * Delete a message (within 15 min window)
   */
  static deleteMessage = asyncHandler(async (req, res) => {
    const message = await ChatService.deleteMessage(req.user._id, req.params.messageId);

    res
      .status(200)
      .json(new ApiResponse(200, { message }, "Message deleted"));
  });
}

export default ChatController;
