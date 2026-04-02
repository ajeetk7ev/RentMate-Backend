/**
 * Notification Model
 *
 * Stores in-app notifications for users.
 * Supports different notification types with polymorphic references.
 */
import mongoose from "mongoose";
import { NotificationType } from "../utils/constants.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, "Notification type is required"],
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
    },

    // Polymorphic reference - can point to any related document
    refModel: {
      type: String,
      enum: ["MatchRequest", "ChatRoom", "RoomListing", "Review"],
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
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

// Fetch unread notifications for a user
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete old notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
