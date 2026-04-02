/**
 * Bookmark Controller
 *
 * Thin HTTP layer for bookmark management.
 * All business logic lives in BookmarkService.
 */
import BookmarkService from "../services/bookmark.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class BookmarkController {
  /**
   * POST /api/v1/bookmarks/rooms
   * Toggle bookmark for a room listing
   */
  static toggleRoomBookmark = asyncHandler(async (req, res) => {
    const result = await BookmarkService.toggleRoomBookmark(req.user._id, req.body.roomId);

    const message = result.bookmarked ? "Room bookmarked" : "Room bookmark removed";

    res
      .status(200)
      .json(new ApiResponse(200, result, message));
  });

  /**
   * POST /api/v1/bookmarks/roommates
   * Toggle bookmark for a roommate profile
   */
  static toggleRoommateBookmark = asyncHandler(async (req, res) => {
    const result = await BookmarkService.toggleRoommateBookmark(req.user._id, req.body.roommateId);

    const message = result.bookmarked ? "Roommate bookmarked" : "Roommate bookmark removed";

    res
      .status(200)
      .json(new ApiResponse(200, result, message));
  });

  /**
   * GET /api/v1/bookmarks
   * Get all bookmarks with optional type filter
   */
  static getMyBookmarks = asyncHandler(async (req, res) => {
    const result = await BookmarkService.getMyBookmarks(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Bookmarks fetched successfully"));
  });

  /**
   * DELETE /api/v1/bookmarks/:id
   * Remove a specific bookmark
   */
  static removeBookmark = asyncHandler(async (req, res) => {
    const result = await BookmarkService.removeBookmark(req.user._id, req.params.id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Bookmark removed successfully"));
  });

  /**
   * GET /api/v1/bookmarks/check
   * Check if a specific item is bookmarked
   */
  static checkBookmarkStatus = asyncHandler(async (req, res) => {
    const result = await BookmarkService.checkBookmarkStatus(
      req.user._id,
      req.query.targetId,
      req.query.type
    );

    res
      .status(200)
      .json(new ApiResponse(200, result, "Bookmark status checked"));
  });

  /**
   * POST /api/v1/bookmarks/bulk-check
   * Bulk check bookmark status for multiple items
   */
  static bulkCheckBookmarkStatus = asyncHandler(async (req, res) => {
    const result = await BookmarkService.bulkCheckBookmarkStatus(
      req.user._id,
      req.body.targetIds,
      req.body.type
    );

    res
      .status(200)
      .json(new ApiResponse(200, { bookmarkedMap: result }, "Bulk bookmark status checked"));
  });

  /**
   * GET /api/v1/bookmarks/counts
   * Get bookmark counts (rooms + roommates)
   */
  static getBookmarkCounts = asyncHandler(async (req, res) => {
    const counts = await BookmarkService.getBookmarkCounts(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, { counts }, "Bookmark counts fetched"));
  });
}

export default BookmarkController;
