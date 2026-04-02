/**
 * Message Model
 *
 * Individual messages within a chat room.
 * Supports text and image message types.
 */
import mongoose from "mongoose";
import { MessageType } from "../utils/constants.js";

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: [true, "Chat room is required"],
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },

    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },

    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },

    // For image messages
    attachment: {
      url: { type: String },
      publicId: { type: String },
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient message retrieval for a chat room
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ chatRoom: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
