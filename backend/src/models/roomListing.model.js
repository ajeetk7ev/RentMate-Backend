/**
 * Room Listing Model
 *
 * Stores room details posted by owners including rent, location,
 * amenities, images, and roommate preferences.
 */
import mongoose from "mongoose";
import {
  RoomType,
  GenderPreference,
  ListingStatus,
} from "../utils/constants.js";

const roomListingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Pricing
    rent: {
      type: Number,
      required: [true, "Rent amount is required"],
      min: [0, "Rent cannot be negative"],
    },

    deposit: {
      type: Number,
      default: 0,
      min: [0, "Deposit cannot be negative"],
    },

    // Location
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      lowercase: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "Please provide a valid 6-digit pincode"],
    },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Room Details
    roomType: {
      type: String,
      enum: Object.values(RoomType),
      required: [true, "Room type is required"],
    },

    totalRoommates: {
      type: Number,
      default: 1,
      min: [1, "Must have at least 1 roommate slot"],
      max: [10, "Cannot exceed 10 roommates"],
    },

    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },

    furnishing: {
      type: String,
      enum: ["furnished", "semi-furnished", "unfurnished"],
      default: "semi-furnished",
    },

    // Preferences
    genderPreference: {
      type: String,
      enum: Object.values(GenderPreference),
      default: GenderPreference.ANY,
    },

    // Amenities
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    // Rules
    rules: [
      {
        type: String,
        trim: true,
      },
    ],

    // Images
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    // Availability
    availableFrom: {
      type: Date,
      required: [true, "Available from date is required"],
    },

    // Status
    status: {
      type: String,
      enum: Object.values(ListingStatus),
      default: ListingStatus.ACTIVE,
    },

    // Engagement Metrics
    viewCount: {
      type: Number,
      default: 0,
    },

    interestCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
roomListingSchema.index({ coordinates: "2dsphere" });

// Text index for full-text search (weighted by field relevance)
roomListingSchema.index(
  { title: "text", description: "text", address: "text", city: "text" },
  { weights: { title: 10, city: 5, address: 3, description: 1 } }
);

// Compound indexes for search and filtering
roomListingSchema.index({ city: 1, status: 1, rent: 1 });
roomListingSchema.index({ status: 1, roomType: 1, genderPreference: 1 });
roomListingSchema.index({ owner: 1, status: 1 });
roomListingSchema.index({ createdAt: -1 });
roomListingSchema.index({ rent: 1 });
roomListingSchema.index({ viewCount: -1, interestCount: -1 });

const RoomListing = mongoose.model("RoomListing", roomListingSchema);

export default RoomListing;
