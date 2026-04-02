/**
 * Review Model
 *
 * User-to-user reviews and ratings. Can optionally be
 * linked to a specific room listing for room-level feedback.
 */
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer is required"],
    },

    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewee is required"],
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomListing",
      default: null,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    // Breakdown ratings
    categories: {
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      reliability: {
        type: Number,
        min: 1,
        max: 5,
      },
      respect: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One review per reviewer-reviewee pair (optionally per room)
reviewSchema.index(
  { reviewer: 1, reviewee: 1, room: 1 },
  { unique: true }
);

// Query indexes
reviewSchema.index({ reviewee: 1, rating: -1 });
reviewSchema.index({ room: 1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
