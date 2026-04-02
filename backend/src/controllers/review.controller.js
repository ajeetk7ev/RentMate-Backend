/**
 * Review Controller
 *
 * Thin HTTP layer for user/room ratings and reviews.
 */
import ReviewService from "../services/review.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class ReviewController {
  /**
   * POST /api/v1/reviews
   * Create a new review.
   */
  static createReview = asyncHandler(async (req, res) => {
    const review = await ReviewService.createReview(req.user._id, req.body);

    res
      .status(201)
      .json(new ApiResponse(201, { review }, "Review created successfully"));
  });

  /**
   * PUT /api/v1/reviews/:id
   * Update a review. (48-hour edit window)
   */
  static updateReview = asyncHandler(async (req, res) => {
    const updatedReview = await ReviewService.updateReview(
      req.user._id,
      req.params.id,
      req.body
    );

    res
      .status(200)
      .json(new ApiResponse(200, { updatedReview }, "Review updated successfully"));
  });

  /**
   * DELETE /api/v1/reviews/:id
   * Delete a review.
   */
  static deleteReview = asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === "admin";
    const result = await ReviewService.deleteReview(req.user._id, req.params.id, isAdmin);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Review deleted successfully"));
  });

  /**
   * GET /api/v1/reviews/user/:userId
   * Get all reviews for a specific user.
   */
  static getUserReviews = asyncHandler(async (req, res) => {
    const result = await ReviewService.getUserReviews(req.params.userId, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "User reviews fetched successfully"));
  });

  /**
   * GET /api/v1/reviews/room/:roomId
   * Get all reviews for a specific room.
   */
  static getRoomReviews = asyncHandler(async (req, res) => {
    const result = await ReviewService.getRoomReviews(req.params.roomId, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Room reviews fetched successfully"));
  });

  /**
   * GET /api/v1/reviews/user/:userId/stats
   * Get overall stats (average rating, cleanup counts) for a user.
   */
  static getUserStats = asyncHandler(async (req, res) => {
    const stats = await ReviewService.getUserStats(req.params.userId);

    res
      .status(200)
      .json(new ApiResponse(200, { stats }, "User review stats fetched successfully"));
  });
}

export default ReviewController;
