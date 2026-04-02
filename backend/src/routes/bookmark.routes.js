/**
 * Bookmark Routes
 *
 * All routes require authentication.
 *
 * GET    /api/v1/bookmarks           - Get all bookmarks (with type filter)
 * GET    /api/v1/bookmarks/counts    - Get bookmark counts
 * GET    /api/v1/bookmarks/check     - Check if an item is bookmarked
 * POST   /api/v1/bookmarks/rooms     - Toggle room bookmark
 * POST   /api/v1/bookmarks/roommates - Toggle roommate bookmark
 * POST   /api/v1/bookmarks/bulk-check - Bulk check bookmark status
 * DELETE /api/v1/bookmarks/:id       - Remove a bookmark
 */
import { Router } from "express";

import BookmarkController from "../controllers/bookmark.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";

import {
  bookmarkRoomSchema,
  bookmarkRoommateSchema,
  listBookmarksQuerySchema,
  checkBookmarkQuerySchema,
  bulkCheckBookmarkSchema,
} from "../validations/bookmark.validation.js";

const router = Router();

// All bookmark routes require authentication
router.use(isAuthenticated);

// List & counts (static routes first)
router.get("/", validateQuery(listBookmarksQuerySchema), BookmarkController.getMyBookmarks);
router.get("/counts", BookmarkController.getBookmarkCounts);
router.get("/check", validateQuery(checkBookmarkQuerySchema), BookmarkController.checkBookmarkStatus);

// Toggle bookmarks
router.post("/rooms", validate(bookmarkRoomSchema), BookmarkController.toggleRoomBookmark);
router.post("/roommates", validate(bookmarkRoommateSchema), BookmarkController.toggleRoommateBookmark);

// Bulk check
router.post("/bulk-check", validate(bulkCheckBookmarkSchema), BookmarkController.bulkCheckBookmarkStatus);

// Remove bookmark
router.delete("/:id", BookmarkController.removeBookmark);

export default router;
