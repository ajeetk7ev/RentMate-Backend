/**
 * Bookmark Model
 *
 * Allows users to save/favorite room listings for later viewing.
 */
import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomListing",
      required: [true, "Room listing is required"],
    },
  },
  {
    timestamps: true,
  }
);

// One bookmark per user-room pair
bookmarkSchema.index({ user: 1, room: 1 }, { unique: true });

// Fetch all bookmarks for a user
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

export default Bookmark;
