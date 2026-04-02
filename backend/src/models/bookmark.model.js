/**
 * Bookmark Model
 *
 * Allows users to save/favorite room listings and roommate profiles.
 * Uses a polymorphic pattern — a single bookmark can reference either
 * a room or a user (roommate), tracked via the `type` field.
 */
import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    // What is being bookmarked
    type: {
      type: String,
      enum: ["room", "roommate"],
      required: [true, "Bookmark type is required"],
    },

    // Reference to room listing (populated when type === "room")
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomListing",
    },

    // Reference to user/roommate profile (populated when type === "roommate")
    roommate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one bookmark per user-room or user-roommate pair
bookmarkSchema.index({ user: 1, type: 1, room: 1 }, { unique: true, sparse: true });
bookmarkSchema.index({ user: 1, type: 1, roommate: 1 }, { unique: true, sparse: true });

// Fetch all bookmarks for a user by type
bookmarkSchema.index({ user: 1, type: 1, createdAt: -1 });

// Custom validation: ensure correct reference is set based on type
bookmarkSchema.pre("validate", function (next) {
  if (this.type === "room" && !this.room) {
    return next(new Error("Room reference is required for room bookmarks"));
  }
  if (this.type === "roommate" && !this.roommate) {
    return next(new Error("Roommate reference is required for roommate bookmarks"));
  }
  // Clear the other reference to keep data clean
  if (this.type === "room") this.roommate = undefined;
  if (this.type === "roommate") this.room = undefined;
  next();
});

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

export default Bookmark;
