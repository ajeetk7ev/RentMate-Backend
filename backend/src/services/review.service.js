/**
 * Review Service
 *
 * Business logic for user-to-user and room-level reviews.
 * - Create review (validate match for roommate feedback)
 * - Update review (48-hour limit)
 * - Delete review
 * - Fetch reviews (user/room)
 * - Get user stats (total reviews, avg rating)
 */
import Review from "../models/review.model.js";
import MatchRequest from "../models/matchRequest.model.js";
import RoomListing from "../models/roomListing.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { MatchRequestStatus, PAGINATION, NotificationType } from "../utils/constants.js";
import logger from "../config/logger.js";
import NotificationProducer from "../queues/notification.producer.js";
import mongoose from "mongoose";

class ReviewService {
  /**
   * Create a new review.
   * Restricts roommate reviews to users with an accepted match.
   */
  static async createReview(reviewerId, { revieweeId, roomId, rating, comment, categories }) {
    // 1. Prevent self-review
    if (reviewerId.toString() === revieweeId.toString()) {
      throw new ApiError(400, "You cannot review yourself");
    }

    // 2. Roommate Review Validation:
    // Only allow reviews if there was an accepted match request between the two users.
    // If a roomId is provided, it's a room-level review, which we'll allow seekers to do.
    if (!roomId) {
      const matchExists = await MatchRequest.findOne({
        $or: [
          { sender: reviewerId, receiver: revieweeId },
          { sender: revieweeId, receiver: reviewerId },
        ],
        status: MatchRequestStatus.ACCEPTED,
      });

      if (!matchExists) {
        throw new ApiError(
          403,
          "You can only review users you have successfully matched with"
        );
      }
    } else {
      // If it's a room review, check if room exists
      const room = await RoomListing.findById(roomId);
      if (!room) {
        throw new ApiError(404, "Room listing not found");
      }
    }

    // 3. Check for existing review (prevent duplicates)
    const existingReview = await Review.findOne({
      reviewer: reviewerId,
      reviewee: revieweeId,
      room: roomId || null,
    });

    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this target");
    }

    // 4. Create review
    const review = await Review.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      room: roomId || null,
      rating,
      comment,
      categories,
    });

    await review.populate("reviewer", "name avatar");
    
    logger.info(`Review created by ${reviewerId} for ${revieweeId}`);

    // Trigger Notification to reviewee
    const reviewer = await User.findById(reviewerId).select("name");
    NotificationProducer.publishNotification({
      recipient: revieweeId,
      sender: reviewerId,
      type: NotificationType.SYSTEM, // Using system/review type
      title: "New Review Received",
      message: `${reviewer.name} shared feedback on your profile with a ${rating}-star rating!`,
      refModel: "Review",
      refId: review._id,
    });

    return review;
  }

  /**
   * Update a review (48-hour window).
   */
  static async updateReview(reviewerId, reviewId, updateData) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (review.reviewer.toString() !== reviewerId.toString()) {
      throw new ApiError(403, "You can only update your own reviews");
    }

    // 48-hour edit window
    const fortyEightHours = 48 * 60 * 60 * 1000;
    if (Date.now() - review.createdAt.getTime() > fortyEightHours) {
      throw new ApiError(400, "Reviews can only be edited within 48 hours of creation");
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        ...updateData,
        isEdited: true,
      },
      { new: true }
    ).populate("reviewer", "name avatar");

    logger.info(`Review ${reviewId} updated by ${reviewerId}`);

    return updatedReview;
  }

  /**
   * Delete a review.
   */
  static async deleteReview(reviewerId, reviewId, isAdmin = false) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Only reviewer or admin can delete
    if (!isAdmin && review.reviewer.toString() !== reviewerId.toString()) {
      throw new ApiError(403, "You can only delete your own reviews");
    }

    await Review.findByIdAndDelete(reviewId);

    logger.info(`Review ${reviewId} deleted by ${reviewerId} (isAdmin: ${isAdmin})`);

    return { message: "Review deleted successfully" };
  }

  /**
   * Get paginated reviews for a user.
   */
  static async getUserReviews(revieweeId, queryParams = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      Review.find({ reviewee: revieweeId })
        .populate("reviewer", "name avatar age city gender")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ reviewee: revieweeId }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      reviews,
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
   * Get paginated reviews for a specific room.
   */
  static async getRoomReviews(roomId, queryParams = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      Review.find({ room: roomId })
        .populate("reviewer", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ room: roomId }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      reviews,
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
   * Get overall stats (average rating and counts) for a user.
   */
  static async getUserStats(revieweeId) {
    const stats = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(revieweeId) } },
      {
        $group: {
          _id: "$reviewee",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          cleanlinessAvg: { $avg: "$categories.cleanliness" },
          communicationAvg: { $avg: "$categories.communication" },
          reliabilityAvg: { $avg: "$categories.reliability" },
          respectAvg: { $avg: "$categories.respect" },
        },
      },
    ]);

    if (!stats.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        breakdown: {
          cleanliness: 0,
          communication: 0,
          reliability: 0,
          respect: 0,
        },
      };
    }

    const s = stats[0];
    return {
      averageRating: Math.round(s.averageRating * 10) / 10,
      totalReviews: s.totalReviews,
      breakdown: {
        cleanliness: Math.round(s.cleanlinessAvg * 10) / 10 || 0,
        communication: Math.round(s.communicationAvg * 10) / 10 || 0,
        reliability: Math.round(s.reliabilityAvg * 10) / 10 || 0,
        respect: Math.round(s.respectAvg * 10) / 10 || 0,
      },
    };
  }
}

export default ReviewService;
