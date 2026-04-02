/**
 * Chat Socket Event Handlers
 *
 * Handles all real-time chat events:
 * - join-room: Join a chat room
 * - leave-room: Leave a chat room
 * - send-message: Send a message (persisted + broadcast)
 * - typing: Typing indicator
 * - stop-typing: Stop typing indicator
 * - mark-read: Mark messages as read
 */
import ChatService from "../services/chat.service.js";
import logger from "../config/logger.js";

export const registerChatHandlers = (io, socket) => {
  const userId = socket.userId;

  /**
   * Join a chat room.
   * Validates user is a participant before allowing join.
   */
  socket.on("join-room", async (chatRoomId, callback) => {
    try {
      // Validate access
      const chatRoom = await ChatService.validateRoomAccess(userId, chatRoomId);

      if (!chatRoom) {
        return callback?.({ error: "You are not a participant of this chat room" });
      }

      socket.join(`chat:${chatRoomId}`);
      logger.info(`User ${userId} joined room: ${chatRoomId}`);

      callback?.({ success: true });
    } catch (error) {
      logger.error(`Join room error: ${error.message}`);
      callback?.({ error: error.message });
    }
  });

  /**
   * Leave a chat room.
   */
  socket.on("leave-room", (chatRoomId) => {
    socket.leave(`chat:${chatRoomId}`);
    logger.info(`User ${userId} left room: ${chatRoomId}`);
  });

  /**
   * Send a message.
   * Persists to DB, then broadcasts to room participants.
   */
  socket.on("send-message", async (data, callback) => {
    try {
      const { chatRoomId, content, type = "text" } = data;

      if (!chatRoomId || !content?.trim()) {
        return callback?.({ error: "Chat room ID and message content are required" });
      }

      // Persist message and get populated result
      const message = await ChatService.sendMessage(userId, {
        chatRoomId,
        content: content.trim(),
        type,
      });

      // Broadcast to all participants in the room (except sender)
      socket.to(`chat:${chatRoomId}`).emit("new-message", message);

      // Also emit to sender for confirmation
      callback?.({ success: true, message });

      // Send notification to offline participants via their personal room
      const chatRoom = await ChatService.getChatRoomById(chatRoomId);
      if (chatRoom) {
        chatRoom.participants.forEach((participantId) => {
          const pid = participantId.toString();
          if (pid !== userId.toString()) {
            io.to(`user:${pid}`).emit("message-notification", {
              chatRoomId,
              message,
            });
          }
        });
      }
    } catch (error) {
      logger.error(`Send message error: ${error.message}`);
      callback?.({ error: error.message });
    }
  });

  /**
   * Typing indicator — broadcast to other room participants.
   */
  socket.on("typing", (chatRoomId) => {
    socket.to(`chat:${chatRoomId}`).emit("user-typing", {
      userId,
      chatRoomId,
    });
  });

  /**
   * Stop typing indicator.
   */
  socket.on("stop-typing", (chatRoomId) => {
    socket.to(`chat:${chatRoomId}`).emit("user-stop-typing", {
      userId,
      chatRoomId,
    });
  });

  /**
   * Mark messages as read in a chat room.
   * Updates DB and notifies the sender.
   */
  socket.on("mark-read", async (chatRoomId, callback) => {
    try {
      await ChatService.markMessagesAsRead(userId, chatRoomId);

      // Notify other participants that messages were read
      socket.to(`chat:${chatRoomId}`).emit("messages-read", {
        userId,
        chatRoomId,
      });

      callback?.({ success: true });
    } catch (error) {
      logger.error(`Mark read error: ${error.message}`);
      callback?.({ error: error.message });
    }
  });

  /**
   * Get online status of a user.
   */
  socket.on("check-online", async (targetUserId, callback) => {
    const sockets = await io.in(`user:${targetUserId}`).fetchSockets();
    callback?.({ isOnline: sockets.length > 0 });
  });
};
