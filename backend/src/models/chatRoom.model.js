/**
 * Chat Room Model
 *
 * Created when a match request is accepted.
 * Tracks participants, last message, and unread counts.
 */
import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchRequest",
      default: null,
    },

    lastMessage: {
      content: { type: String, default: "" },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sentAt: { type: Date },
    },

    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chat room lookups
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ "lastMessage.sentAt": -1 });
chatRoomSchema.index({ updatedAt: -1 });

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;
