/**
 * Bookmark Service
 *
 * Business logic for bookmarking rooms and roommate profiles.
 * - Toggle bookmark (add/remove in one action)
 * - Bookmark room / roommate
 * - Remove bookmark
 * - List bookmarks (with type filter & pagination)
 * - Check if bookmarked
 * - Bulk check bookmark status (for UI badge rendering)
 */
import Bookmark from "../models/bookmark.model.js";
import RoomListing from "../models/roomListing.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { PAGINATION } from "../utils/constants.js";
import logger from "../config/logger.js";

class BookmarkService {
  /**
   * Toggle bookmark for a room — adds if not bookmarked, removes if already bookmarked.
   * Best UX pattern: single button tap to bookmark/unbookmark.
   * @returns {{ bookmarked: boolean, bookmark: Object|null }}
   */
  static async toggleRoomBookmark(userId, roomId) {
    // Verify room exists and is active
    const room = await RoomListing.findById(roomId);
    if (!room) {
      throw new ApiError(404, "Room listing not found");
    }

    // Prevent bookmarking own listing
    if (room.owner.toString() === userId.toString()) {
      throw new ApiError(400, "You cannot bookmark your own listing");
    }

    // Check if already bookmarked
    const existing = await Bookmark.findOne({
      user: userId,
      type: "room",
      room: roomId,
    });

    if (existing) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existing._id);
      logger.info(`Room bookmark removed: user=${userId}, room=${roomId}`);
      return { bookmarked: false, bookmark: null };
    }

    // Add bookmark
    const bookmark = await Bookmark.create({
      user: userId,
      type: "room",
      room: roomId,
    });

    logger.info(`Room bookmarked: user=${userId}, room=${roomId}`);
    return { bookmarked: true, bookmark };
  }

  /**
   * Toggle bookmark for a roommate profile.
   * @returns {{ bookmarked: boolean, bookmark: Object|null }}
   */
  static async toggleRoommateBookmark(userId, roommateId) {
    // Prevent bookmarking self
    if (userId.toString() === roommateId.toString()) {
      throw new ApiError(400, "You cannot bookmark your own profile");
    }

    // Verify roommate exists and is active
    const roommate = await User.findOne({
      _id: roommateId,
      isActive: true,
      isBlocked: false,
    });

    if (!roommate) {
      throw new ApiError(404, "Roommate profile not found");
    }

    // Check if already bookmarked
    const existing = await Bookmark.findOne({
      user: userId,
      type: "roommate",
      roommate: roommateId,
    });

    if (existing) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existing._id);
      logger.info(`Roommate bookmark removed: user=${userId}, roommate=${roommateId}`);
      return { bookmarked: false, bookmark: null };
    }

    // Add bookmark
    const bookmark = await Bookmark.create({
      user: userId,
      type: "roommate",
      roommate: roommateId,
    });

    logger.info(`Roommate bookmarked: user=${userId}, roommate=${roommateId}`);
    return { bookmarked: true, bookmark };
  }

  /**
   * Get all bookmarks for a user with optional type filter and pagination.
   * Populates room/roommate details for display.
   */
  static async getMyBookmarks(userId, queryParams = {}) {
    const {
      type,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = queryParams;

    const filter = { user: userId };
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [bookmarks, totalCount] = await Promise.all([
      Bookmark.find(filter)
        .populate({
          path: "room",
          select: "title rent city state images roomType furnishing status availableFrom viewCount",
          populate: { path: "owner", select: "name avatar isVerified" },
        })
        .populate({
          path: "roommate",
          select: "name avatar age gender occupation city bio budgetMin budgetMax lifestyleHabits lookingFor isVerified",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      Bookmark.countDocuments(filter),
    ]);

    // Filter out bookmarks where the referenced item has been deleted
    const validBookmarks = bookmarks.filter((b) => {
      if (b.type === "room" && !b.room) return false;
      if (b.type === "roommate" && !b.roommate) return false;
      return true;
    });

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      bookmarks: validBookmarks,
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
   * Remove a specific bookmark by ID.
   * Verifies the bookmark belongs to the requesting user.
   */
  static async removeBookmark(userId, bookmarkId) {
    const bookmark = await Bookmark.findById(bookmarkId);

    if (!bookmark) {
      throw new ApiError(404, "Bookmark not found");
    }

    if (bookmark.user.toString() !== userId.toString()) {
      throw new ApiError(403, "You can only remove your own bookmarks");
    }

    await Bookmark.findByIdAndDelete(bookmarkId);

    logger.info(`Bookmark removed: ${bookmarkId}`);

    return { message: "Bookmark removed successfully" };
  }

  /**
   * Check if a specific room or roommate is bookmarked by the user.
   * Used by frontend to show filled/unfilled bookmark icon.
   */
  static async checkBookmarkStatus(userId, targetId, type) {
    if (!["room", "roommate"].includes(type)) {
      throw new ApiError(400, "Type must be room or roommate");
    }

    const filter = { user: userId, type };
    if (type === "room") filter.room = targetId;
    if (type === "roommate") filter.roommate = targetId;

    const bookmark = await Bookmark.findOne(filter).lean();

    return { isBookmarked: !!bookmark };
  }

  /**
   * Bulk check bookmark status for multiple items.
   * Returns a map of { itemId: true/false }.
   * Used when rendering a list of rooms/roommates with bookmark icons.
   */
  static async bulkCheckBookmarkStatus(userId, targetIds, type) {
    if (!["room", "roommate"].includes(type)) {
      throw new ApiError(400, "Type must be room or roommate");
    }

    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      return {};
    }

    // Cap at 50 items per request
    const ids = targetIds.slice(0, 50);

    const filter = { user: userId, type };
    if (type === "room") filter.room = { $in: ids };
    if (type === "roommate") filter.roommate = { $in: ids };

    const bookmarks = await Bookmark.find(filter)
      .select(type === "room" ? "room" : "roommate")
      .lean();

    // Build result map
    const bookmarkedMap = {};
    ids.forEach((id) => {
      bookmarkedMap[id] = false;
    });

    bookmarks.forEach((b) => {
      const key = type === "room" ? b.room?.toString() : b.roommate?.toString();
      if (key) bookmarkedMap[key] = true;
    });

    return bookmarkedMap;
  }

  /**
   * Get bookmark counts for the user (for profile stats).
   */
  static async getBookmarkCounts(userId) {
    const [roomCount, roommateCount] = await Promise.all([
      Bookmark.countDocuments({ user: userId, type: "room" }),
      Bookmark.countDocuments({ user: userId, type: "roommate" }),
    ]);

    return {
      rooms: roomCount,
      roommates: roommateCount,
      total: roomCount + roommateCount,
    };
  }
}

export default BookmarkService;
