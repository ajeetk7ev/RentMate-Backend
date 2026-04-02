/**
 * Report Model
 *
 * Handles user reports for fake listings, harassment, spam, etc.
 * Reviewed by admins through the admin panel.
 */
import mongoose from "mongoose";
import { ReportReason, ReportStatus } from "../utils/constants.js";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reportedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomListing",
      default: null,
    },

    reason: {
      type: String,
      enum: Object.values(ReportReason),
      required: [true, "Reason is required"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // Evidence screenshots
    evidence: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],

    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
    },

    // Admin moderation
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports from same user for same target
reportSchema.index(
  { reporter: 1, reportedUser: 1, reportedRoom: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

// Admin queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, status: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
