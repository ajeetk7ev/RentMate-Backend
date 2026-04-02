/**
 * Chat Service
 *
 * Business logic for the chat system.
 * - Send and persist messages
 * - Get chat rooms for a user
 * - Get message history with pagination
 * - Mark messages as read
 * - Validate room access
 * - Get unread counts
 */
import ChatRoom from "../models/chatRoom.model.js";
import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { PAGINATION, NotificationType } from "../utils/constants.js";
import logger from "../config/logger.js";
import NotificationProducer from "../queues/notification.producer.js";

class ChatService {
  /**
   * Validate that a user is a participant of a chat room.
   * @returns {Object|null} chat room if valid, null otherwise
   */
  static async validateRoomAccess(userId, chatRoomId) {
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      participants: userId,
      isActive: true,
    });

    return chatRoom;
  }

  /**
   * Get a chat room by ID (internal use).
   */
  static async getChatRoomById(chatRoomId) {
    return await ChatRoom.findById(chatRoomId).lean();
  }

  /**
   * Send and persist a message.
   * Updates the chat room's lastMessage and unread counts.
   * @returns {Object} populated message document
   */
  static async sendMessage(senderId, { chatRoomId, content, type = "text" }) {
    // Validate room access
    const chatRoom = await ChatService.validateRoomAccess(senderId, chatRoomId);

    if (!chatRoom) {
      throw new ApiError(403, "You are not a participant of this chat room");
    }

    // Create message
    const message = await Message.create({
      chatRoom: chatRoomId,
      sender: senderId,
      content,
      type,
    });

    // Update chat room's last message and increment unread for other participants
    const unreadUpdate = {};
    chatRoom.participants.forEach((participantId) => {
      const pid = participantId.toString();
      if (pid !== senderId.toString()) {
        unreadUpdate[`unreadCount.${pid}`] = 1;
      }
    });

    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      lastMessage: {
        content,
        sender: senderId,
        sentAt: new Date(),
      },
      $inc: unreadUpdate,
    });

    // Populate sender details
    await message.populate("sender", "name avatar");

    logger.info(`Message sent in room ${chatRoomId} by user ${senderId}`);

    // Trigger Notification for each participant other than sender
    const sender = await User.findById(senderId).select("name");
    chatRoom.participants.forEach((participantId) => {
      const pid = participantId.toString();
      if (pid !== senderId.toString()) {
        NotificationProducer.publishNotification({
          recipient: pid,
          sender: senderId,
          type: NotificationType.CHAT,
          title: `New message from ${sender.name}`,
          message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
          refModel: "ChatRoom",
          refId: chatRoomId,
        });
      }
    });

    return message;
  }

  /**
   * Get all chat rooms for a user.
   * Returns rooms sorted by last message time with participant details.
   */
  static async getMyChatRooms(userId, queryParams = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;

    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const filter = {
      participants: userId,
      isActive: true,
    };

    const [chatRooms, totalCount] = await Promise.all([
      ChatRoom.find(filter)
        .populate("participants", "name avatar isVerified")
        .populate("match", "compatibilityScore")
        .sort({ "lastMessage.sentAt": -1, updatedAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      ChatRoom.countDocuments(filter),
    ]);

    // Transform: add the "otherUser" field and unread count for current user
    const formattedRooms = chatRooms.map((room) => {
      const otherUser = room.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: room._id,
        otherUser,
        lastMessage: room.lastMessage,
        unreadCount: room.unreadCount?.get?.(userId.toString()) || room.unreadCount?.[userId.toString()] || 0,
        compatibilityScore: room.match?.compatibilityScore || null,
        isActive: room.isActive,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };
    });

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      chatRooms: formattedRooms,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit: effectiveLimit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get message history for a chat room with pagination.
   * Returns messages in reverse chronological order (newest first).
   */
  static async getMessages(userId, chatRoomId, queryParams = {}) {
    // Validate access
    const chatRoom = await ChatService.validateRoomAccess(userId, chatRoomId);
    if (!chatRoom) {
      throw new ApiError(403, "You are not a participant of this chat room");
    }

    const { page = PAGINATION.DEFAULT_PAGE, limit = 30 } = queryParams;
    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, 50);

    const [messages, totalCount] = await Promise.all([
      Message.find({ chatRoom: chatRoomId })
        .populate("sender", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      Message.countDocuments({ chatRoom: chatRoomId }),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      messages: messages.reverse(), // return in chronological order
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit: effectiveLimit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Mark all unread messages in a chat room as read for a user.
   * Resets the unread count for that user.
   */
  static async markMessagesAsRead(userId, chatRoomId) {
    // Validate access
    const chatRoom = await ChatService.validateRoomAccess(userId, chatRoomId);
    if (!chatRoom) {
      throw new ApiError(403, "You are not a participant of this chat room");
    }

    // Mark messages as read
    await Message.updateMany(
      {
        chatRoom: chatRoomId,
        sender: { $ne: userId },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count for this user
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      [`unreadCount.${userId}`]: 0,
    });

    logger.info(`Messages marked as read in room ${chatRoomId} by user ${userId}`);

    return { message: "Messages marked as read" };
  }

  /**
   * Get total unread message count across all chat rooms.
   * Used for the main chat badge icon.
   */
  static async getTotalUnreadCount(userId) {
    const chatRooms = await ChatRoom.find({
      participants: userId,
      isActive: true,
    })
      .select("unreadCount")
      .lean();

    let totalUnread = 0;
    chatRooms.forEach((room) => {
      const count = room.unreadCount?.get?.(userId.toString()) || room.unreadCount?.[userId.toString()] || 0;
      totalUnread += count;
    });

    return { totalUnread };
  }

  /**
   * Delete a message (soft — only sender can delete, within 15 min).
   */
  static async deleteMessage(userId, messageId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    if (message.sender.toString() !== userId.toString()) {
      throw new ApiError(403, "You can only delete your own messages");
    }

    // Allow delete only within 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fifteenMinutes) {
      throw new ApiError(400, "Messages can only be deleted within 15 minutes of sending");
    }

    message.content = "This message was deleted";
    message.type = "system";
    await message.save();

    logger.info(`Message ${messageId} deleted by user ${userId}`);

    return message;
  }

  /**
   * Get chat room details including participant profiles.
   */
  static async getChatRoomDetails(userId, chatRoomId) {
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      participants: userId,
    })
      .populate("participants", "name avatar age gender occupation city isVerified")
      .populate("match", "compatibilityScore scoreBreakdown")
      .lean();

    if (!chatRoom) {
      throw new ApiError(404, "Chat room not found");
    }

    return chatRoom;
  }
}

export default ChatService;
