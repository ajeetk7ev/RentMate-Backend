/**
 * User Model
 *
 * Stores user credentials, profile details, lifestyle preferences,
 * and search preferences. Supports both room owners and seekers.
 * Supports signup via email, phone, or Google OAuth.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";
import {
  UserRoles,
  Gender,
  FoodPreference,
  SmokingDrinking,
  SleepSchedule,
  LookingFor,
  MoveInTimeline,
} from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values (for phone-only signups)
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    phone: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values (for email-only signups)
      trim: true,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password by default
    },

    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    role: {
      type: String,
      enum: Object.values(UserRoles),
      default: UserRoles.SEEKER,
    },

    // Profile Details
    age: {
      type: Number,
      min: [18, "Must be at least 18 years old"],
      max: [100, "Age cannot exceed 100"],
    },

    gender: {
      type: String,
      enum: Object.values(Gender),
    },

    occupation: {
      type: String,
      trim: true,
      maxlength: [100, "Occupation cannot exceed 100 characters"],
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },

    // Location Preferences
    preferredLocations: [
      {
        type: String,
        trim: true,
      },
    ],

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    // Budget Preferences
    budgetMin: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },

    budgetMax: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },

    // Lifestyle Habits
    lifestyleHabits: {
      foodPreference: {
        type: String,
        enum: Object.values(FoodPreference),
        default: FoodPreference.NO_PREFERENCE,
      },
      smoking: {
        type: String,
        enum: Object.values(SmokingDrinking),
        default: SmokingDrinking.NO,
      },
      drinking: {
        type: String,
        enum: Object.values(SmokingDrinking),
        default: SmokingDrinking.NO,
      },
      sleepSchedule: {
        type: String,
        enum: Object.values(SleepSchedule),
        default: SleepSchedule.FLEXIBLE,
      },
    },

    // Search Preferences
    lookingFor: {
      type: String,
      enum: Object.values(LookingFor),
      default: LookingFor.BOTH,
    },

    moveInTimeline: {
      type: String,
      enum: Object.values(MoveInTimeline),
      default: MoveInTimeline.FLEXIBLE,
    },

    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    // Verification & Status
    isVerified: {
      type: Boolean,
      default: false,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Auth provider tracking
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Track last login
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
userSchema.index({ city: 1, role: 1, isActive: 1 });
userSchema.index({ budgetMin: 1, budgetMax: 1 });
userSchema.index({ gender: 1, lookingFor: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      phone: this.phone,
      role: this.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE }
  );
};

// Generate password reset token (plain token for URL, hashed stored in DB)
userSchema.methods.generateResetPasswordToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash and store in DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiry — 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // Return plain token (sent via email)
  return resetToken;
};

// Check if profile is complete
userSchema.methods.checkProfileComplete = function () {
  const requiredFields = [
    this.name,
    this.age,
    this.gender,
    this.occupation,
    this.city,
    this.budgetMin !== undefined,
    this.budgetMax !== undefined,
  ];

  return requiredFields.every(Boolean);
};

const User = mongoose.model("User", userSchema);

export default User;
