/**
 * Admin Service
 *
 * High-level administrative operations.
 * - Dashboard statistics & analytics
 * - User management (Block/Verify/Role)
 * - Listing moderation (Deactivate/Feature)
 * - Report management integration
 */
import User from "../models/user.model.js";
import RoomListing from "../models/roomListing.model.js";
import MatchRequest from "../models/matchRequest.model.js";
import Report from "../models/report.model.js";
import { ApiError } from "../utils/ApiError.js";
import { PAGINATION, ReportStatus } from "../utils/constants.js";
import logger from "../config/logger.js";

class AdminService {
  /**
   * Get overall dashboard statistics.
   */
  static async getDashboardStats() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers24h,
      totalListings,
      activeListings,
      totalMatches,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      RoomListing.countDocuments(),
      RoomListing.countDocuments({ status: "active" }),
      MatchRequest.countDocuments({ status: "accepted" }),
      Report.countDocuments({ status: ReportStatus.PENDING }),
    ]);

    return {
      users: {
        total: totalUsers,
        newToday: newUsers24h,
      },
      listings: {
        total: totalListings,
        active: activeListings,
      },
      matches: {
        total: totalMatches,
      },
      moderation: {
        pendingReports,
      },
    };
  }

  /**
   * Get all users with administrative filters and pagination.
   */
  static async getAllUsers(queryParams = {}) {
    const {
      role,
      isVerified,
      isBlocked,
      city,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = queryParams;

    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === "true";
    if (city) filter.city = { $regex: new RegExp(city, "i") };

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Moderate a user (Verify, Block, or Change Role).
   */
  static async updateUserModeration(userId, updates) {
    const { isVerified, isBlocked, role } = updates;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    if (role !== undefined) user.role = role;

    await user.save();

    logger.info(`User ${userId} moderated by admin: ${JSON.stringify(updates)}`);

    return user;
  }

  /**
   * Get all listings with administrative filters and pagination.
   */
  static async getAllListings(queryParams = {}) {
    const {
      status,
      isFeatured,
      city,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = queryParams;

    const filter = {};
    if (status) filter.status = status;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (city) filter.city = { $regex: new RegExp(city, "i") };

    const skip = (page - 1) * limit;

    const [listings, totalCount] = await Promise.all([
      RoomListing.find(filter)
        .populate("owner", "name email avatar isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RoomListing.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      listings,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Moderate a listing (Status OR Featured flag).
   */
  static async updateListingModeration(roomId, updates) {
    const { status, isFeatured } = updates;

    const room = await RoomListing.findById(roomId);
    if (!room) {
      throw new ApiError(404, "Listing not found");
    }

    if (status !== undefined) room.status = status;
    if (isFeatured !== undefined) room.isFeatured = isFeatured;

    await room.save();

    logger.info(`Listing ${roomId} moderated by admin: ${JSON.stringify(updates)}`);

    return room;
  }
}

export default AdminService;
