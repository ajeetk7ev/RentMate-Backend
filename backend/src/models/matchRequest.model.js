/**
 * Match Request Model
 *
 * Tracks interest requests between users for roommate matching.
 * Can optionally be linked to a specific room listing.
 * Stores compatibility score for ranking matches.
 */
import mongoose from "mongoose";
import { MatchRequestStatus } from "../utils/constants.js";

const matchRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver is required"],
      index: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomListing",
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(MatchRequestStatus),
      default: MatchRequestStatus.PENDING,
    },

    compatibilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    scoreBreakdown: {
      budget: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      gender: { type: Number, default: 0 },
      sleepSchedule: { type: Number, default: 0 },
      foodHabits: { type: Number, default: 0 },
      smokingDrinking: { type: Number, default: 0 },
      moveInTimeline: { type: Number, default: 0 },
      ageProximity: { type: Number, default: 0 },
    },

    message: {
      type: String,
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
    },

    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests between same users for same room
matchRequestSchema.index(
  { sender: 1, receiver: 1, room: 1 },
  { unique: true }
);

// Query indexes
matchRequestSchema.index({ receiver: 1, status: 1 });
matchRequestSchema.index({ sender: 1, status: 1 });

const MatchRequest = mongoose.model("MatchRequest", matchRequestSchema);

export default MatchRequest;
