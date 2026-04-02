/**
 * User Service
 *
 * Contains all business logic for user profile management.
 * - Update profile
 * - Upload/remove avatar
 * - Get profile by ID (public view)
 * - Browse roommate profiles (with filters & pagination)
 * - Deactivate / reactivate account
 * - Delete account
 */
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { PAGINATION } from "../utils/constants.js";
import logger from "../config/logger.js";

// Fields to exclude from public profile responses
const SENSITIVE_FIELDS = "-password -resetPasswordToken -resetPasswordExpire -googleId -__v";

// Fields visible in public profile (when viewing another user)
const PUBLIC_PROFILE_FIELDS =
  "name avatar age gender occupation bio city state preferredLocations budgetMin budgetMax lifestyleHabits lookingFor moveInTimeline languages role isVerified isProfileComplete createdAt";

class UserService {
  /**
   * Update user profile fields.
   * Also checks and updates isProfileComplete flag.
   * @returns {Object} updated user document
   */
  static async updateProfile(userId, updateData) {
    // Prevent updating sensitive fields through this method
    const forbiddenFields = [
      "password", "email", "role", "isVerified", "isBlocked",
      "isActive", "googleId", "authProvider", "resetPasswordToken",
      "resetPasswordExpire",
    ];

    forbiddenFields.forEach((field) => {
      delete updateData[field];
    });

    // If phone is being updated, check for duplicates
    if (updateData.phone) {
      const existingPhone = await User.findOne({
        phone: updateData.phone,
        _id: { $ne: userId },
      });

      if (existingPhone) {
        throw new ApiError(409, "This phone number is already in use");
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(SENSITIVE_FIELDS);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check and update profile completeness
    const isComplete = user.checkProfileComplete();
    if (user.isProfileComplete !== isComplete) {
      user.isProfileComplete = isComplete;
      await user.save({ validateBeforeSave: false });
    }

    logger.info(`Profile updated for user: ${userId}`);

    return user;
  }

  /**
   * Upload or update user avatar to Cloudinary.
   * Deletes old avatar if one exists.
   * @returns {Object} updated user document
   */
  static async uploadAvatar(userId, fileBuffer) {
    if (!fileBuffer) {
      throw new ApiError(400, "No image file provided");
    }

    const user = await User.findById(userId).select(SENSITIVE_FIELDS);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId).catch((err) =>
        logger.error(`Failed to delete old avatar: ${err.message}`)
      );
    }

    // Upload new avatar
    const result = await uploadToCloudinary(fileBuffer, "rentmate/avatars");

    user.avatar = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await user.save({ validateBeforeSave: false });

    logger.info(`Avatar uploaded for user: ${userId}`);

    return user;
  }

  /**
   * Remove user avatar.
   * @returns {Object} updated user document
   */
  static async removeAvatar(userId) {
    const user = await User.findById(userId).select(SENSITIVE_FIELDS);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.avatar?.publicId) {
      throw new ApiError(400, "No avatar to remove");
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(user.avatar.publicId).catch((err) =>
      logger.error(`Failed to delete avatar: ${err.message}`)
    );

    user.avatar = { url: "", publicId: "" };
    await user.save({ validateBeforeSave: false });

    logger.info(`Avatar removed for user: ${userId}`);

    return user;
  }

  /**
   * Get own full profile (authenticated user).
   * @returns {Object} user document without sensitive fields
   */
  static async getOwnProfile(userId) {
    const user = await User.findById(userId).select(SENSITIVE_FIELDS);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Get public profile of another user.
   * Only returns publicly visible fields.
   * @returns {Object} limited user document
   */
  static async getPublicProfile(userId) {
    const user = await User.findOne({
      _id: userId,
      isActive: true,
      isBlocked: false,
    }).select(PUBLIC_PROFILE_FIELDS);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Browse roommate profiles with filters and pagination.
   * Excludes the requesting user, blocked, and inactive users.
   * @returns {{ users: Array, pagination: Object }}
   */
  static async browseProfiles(currentUserId, queryParams) {
    const {
      city,
      gender,
      lookingFor,
      budgetMin,
      budgetMax,
      moveInTimeline,
      smokingPreference,
      drinkingPreference,
      foodPreference,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = "latest",
    } = queryParams;

    // Build filter query
    const filter = {
      _id: { $ne: currentUserId }, // exclude self
      isActive: true,
      isBlocked: false,
    };

    if (city) {
      filter.city = { $regex: new RegExp(city, "i") };
    }

    if (gender) {
      filter.gender = gender;
    }

    if (lookingFor) {
      filter.lookingFor = lookingFor;
    }

    if (moveInTimeline) {
      filter.moveInTimeline = moveInTimeline;
    }

    // Budget overlap filter
    if (budgetMin !== undefined) {
      filter.budgetMax = { $gte: budgetMin };
    }

    if (budgetMax !== undefined) {
      filter.budgetMin = { ...filter.budgetMin, $lte: budgetMax };
    }

    // Lifestyle filters
    if (smokingPreference) {
      filter["lifestyleHabits.smoking"] = smokingPreference;
    }

    if (drinkingPreference) {
      filter["lifestyleHabits.drinking"] = drinkingPreference;
    }

    if (foodPreference) {
      filter["lifestyleHabits.foodPreference"] = foodPreference;
    }

    // Sort options
    const sortOptions = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.latest;

    // Pagination
    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Execute query
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select(PUBLIC_PROFILE_FIELDS)
        .sort(sortBy)
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit: effectiveLimit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Deactivate user account (soft delete).
   * User can reactivate by logging in again.
   */
  static async deactivateAccount(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.isActive) {
      throw new ApiError(400, "Account is already deactivated");
    }

    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    logger.info(`Account deactivated for user: ${userId}`);

    return { message: "Account deactivated successfully" };
  }

  /**
   * Permanently delete user account and associated data.
   */
  static async deleteAccount(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Delete avatar from Cloudinary
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId).catch((err) =>
        logger.error(`Failed to delete avatar during account deletion: ${err.message}`)
      );
    }

    await User.findByIdAndDelete(userId);

    logger.info(`Account permanently deleted for user: ${userId}`);

    return { message: "Account deleted permanently" };
  }
}

export default UserService;
