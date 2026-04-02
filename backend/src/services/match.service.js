/**
 * Match Service
 *
 * Business logic for the roommate matching system.
 * - Send / cancel match requests
 * - Accept / reject requests
 * - Compatibility scoring algorithm
 * - Recommended roommates (sorted by compatibility)
 * - Matched connections list
 * - Unmatch (remove connection)
 * - Auto-create chat room on match acceptance
 */
import MatchRequest from "../models/matchRequest.model.js";
import ChatRoom from "../models/chatRoom.model.js";
import User from "../models/user.model.js";
import RoomListing from "../models/roomListing.model.js";
import { ApiError } from "../utils/ApiError.js";
import { MatchRequestStatus, PAGINATION, NotificationType } from "../utils/constants.js";
import logger from "../config/logger.js";
import NotificationProducer from "../queues/notification.producer.js";

class MatchService {
  // ─────────────────────────────────────────────
  // COMPATIBILITY SCORING ENGINE
  // ─────────────────────────────────────────────

  /**
   * Calculate compatibility score between two users.
   * Returns a score 0-100 with per-category breakdown.
   *
   * Scoring weights:
   *   - Budget overlap:     20 points
   *   - Location match:     20 points
   *   - Sleep schedule:     15 points
   *   - Food preference:    10 points
   *   - Smoking match:      10 points
   *   - Drinking match:     10 points
   *   - Move-in timeline:   10 points
   *   - Age proximity:       5 points
   *   Total:              100 points
   */
  static #calculateCompatibility(userA, userB) {
    const breakdown = {
      budget: 0,
      location: 0,
      sleepSchedule: 0,
      foodHabits: 0,
      smokingDrinking: 0,
      moveInTimeline: 0,
      ageProximity: 0,
      gender: 0,
    };

    // 1. Budget overlap (20 pts)
    if (userA.budgetMin !== undefined && userA.budgetMax !== undefined &&
        userB.budgetMin !== undefined && userB.budgetMax !== undefined) {
      const overlapStart = Math.max(userA.budgetMin, userB.budgetMin);
      const overlapEnd = Math.min(userA.budgetMax, userB.budgetMax);

      if (overlapStart <= overlapEnd) {
        const overlapRange = overlapEnd - overlapStart;
        const maxRange = Math.max(
          userA.budgetMax - userA.budgetMin,
          userB.budgetMax - userB.budgetMin,
          1
        );
        breakdown.budget = Math.round((overlapRange / maxRange) * 20);
      }
    }

    // 2. Location match (20 pts)
    if (userA.city && userB.city) {
      if (userA.city.toLowerCase() === userB.city.toLowerCase()) {
        breakdown.location = 15;

        // Bonus for overlapping preferred locations
        if (userA.preferredLocations?.length && userB.preferredLocations?.length) {
          const aLocs = userA.preferredLocations.map((l) => l.toLowerCase());
          const bLocs = userB.preferredLocations.map((l) => l.toLowerCase());
          const overlap = aLocs.filter((l) => bLocs.includes(l));
          if (overlap.length > 0) breakdown.location = 20;
        }
      }
    }

    // 3. Sleep schedule (15 pts)
    const habitsA = userA.lifestyleHabits || {};
    const habitsB = userB.lifestyleHabits || {};

    if (habitsA.sleepSchedule && habitsB.sleepSchedule) {
      if (habitsA.sleepSchedule === habitsB.sleepSchedule) {
        breakdown.sleepSchedule = 15;
      } else if (habitsA.sleepSchedule === "flexible" || habitsB.sleepSchedule === "flexible") {
        breakdown.sleepSchedule = 10;
      }
    }

    // 4. Food preference (10 pts)
    if (habitsA.foodPreference && habitsB.foodPreference) {
      if (habitsA.foodPreference === habitsB.foodPreference) {
        breakdown.foodHabits = 10;
      } else if (habitsA.foodPreference === "no-preference" || habitsB.foodPreference === "no-preference") {
        breakdown.foodHabits = 7;
      }
    }

    // 5. Smoking & Drinking (10 pts each = 20 pts, normalized to 10)
    let smokeDrinkScore = 0;

    if (habitsA.smoking && habitsB.smoking) {
      if (habitsA.smoking === habitsB.smoking) smokeDrinkScore += 10;
      else if (habitsA.smoking === "occasionally" || habitsB.smoking === "occasionally") smokeDrinkScore += 5;
    }

    if (habitsA.drinking && habitsB.drinking) {
      if (habitsA.drinking === habitsB.drinking) smokeDrinkScore += 10;
      else if (habitsA.drinking === "occasionally" || habitsB.drinking === "occasionally") smokeDrinkScore += 5;
    }

    breakdown.smokingDrinking = Math.round(smokeDrinkScore / 2); // normalize to max 10

    // 6. Move-in timeline (10 pts)
    if (userA.moveInTimeline && userB.moveInTimeline) {
      if (userA.moveInTimeline === userB.moveInTimeline) {
        breakdown.moveInTimeline = 10;
      } else if (userA.moveInTimeline === "flexible" || userB.moveInTimeline === "flexible") {
        breakdown.moveInTimeline = 7;
      } else {
        // Partial score for adjacent timelines
        const timelineOrder = ["immediate", "within-1-month", "within-3-months", "flexible"];
        const diff = Math.abs(
          timelineOrder.indexOf(userA.moveInTimeline) -
          timelineOrder.indexOf(userB.moveInTimeline)
        );
        if (diff === 1) breakdown.moveInTimeline = 5;
      }
    }

    // 7. Age proximity (5 pts)
    if (userA.age && userB.age) {
      const ageDiff = Math.abs(userA.age - userB.age);
      if (ageDiff <= 2) breakdown.ageProximity = 5;
      else if (ageDiff <= 5) breakdown.ageProximity = 3;
      else if (ageDiff <= 10) breakdown.ageProximity = 1;
    }

    // Total score
    const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return {
      score: Math.min(totalScore, 100),
      breakdown,
    };
  }

  // ─────────────────────────────────────────────
  // MATCH REQUEST OPERATIONS
  // ─────────────────────────────────────────────

  /**
   * Send a match/interest request to another user.
   * Calculates and stores compatibility score.
   */
  static async sendRequest(senderId, { receiverId, roomId, message }) {
    // Prevent self-request
    if (senderId.toString() === receiverId.toString()) {
      throw new ApiError(400, "You cannot send a match request to yourself");
    }

    // Verify receiver exists and is active
    const receiver = await User.findOne({
      _id: receiverId,
      isActive: true,
      isBlocked: false,
    });

    if (!receiver) {
      throw new ApiError(404, "User not found or account is inactive");
    }

    // Check for existing request (in either direction)
    const existingRequest = await MatchRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: { $in: [MatchRequestStatus.PENDING, MatchRequestStatus.ACCEPTED] },
    });

    if (existingRequest) {
      if (existingRequest.status === MatchRequestStatus.ACCEPTED) {
        throw new ApiError(400, "You are already matched with this user");
      }
      throw new ApiError(400, "A pending request already exists between you and this user");
    }

    // Verify room exists (if provided)
    if (roomId) {
      const room = await RoomListing.findById(roomId);
      if (!room) {
        throw new ApiError(404, "Room listing not found");
      }
    }

    // Get sender profile for compatibility calculation
    const sender = await User.findById(senderId);

    // Calculate compatibility
    const { score, breakdown } = MatchService.#calculateCompatibility(sender, receiver);

    // Create match request
    const matchRequest = await MatchRequest.create({
      sender: senderId,
      receiver: receiverId,
      room: roomId || null,
      message: message || undefined,
      compatibilityScore: score,
      scoreBreakdown: breakdown,
    });

    // Populate sender details for response
    await matchRequest.populate("sender", "name avatar age gender occupation city isVerified");
    await matchRequest.populate("receiver", "name avatar age gender occupation city isVerified");
    if (roomId) await matchRequest.populate("room", "title rent city images");

    logger.info(`Match request sent: ${senderId} -> ${receiverId} (score: ${score})`);

    // Trigger Notification
    NotificationProducer.publishNotification({
      recipient: receiverId,
      sender: senderId,
      type: NotificationType.MATCH,
      title: "New Match Request",
      message: `${sender.name} sent you a roommate match request with ${score}% compatibility!`,
      refModel: "MatchRequest",
      refId: matchRequest._id,
    });

    return matchRequest;
  }

  /**
   * Respond to a match request (accept/reject).
   * Only the receiver can respond.
   * On acceptance: auto-creates a chat room.
   */
  static async respondToRequest(requestId, userId, newStatus) {
    const matchRequest = await MatchRequest.findById(requestId);

    if (!matchRequest) {
      throw new ApiError(404, "Match request not found");
    }

    // Only receiver can respond
    if (matchRequest.receiver.toString() !== userId.toString()) {
      throw new ApiError(403, "Only the receiver can respond to this request");
    }

    if (matchRequest.status !== MatchRequestStatus.PENDING) {
      throw new ApiError(400, `This request has already been ${matchRequest.status}`);
    }

    matchRequest.status = newStatus;
    matchRequest.respondedAt = new Date();
    await matchRequest.save();

    // If accepted, create a chat room
    if (newStatus === MatchRequestStatus.ACCEPTED) {
      // Check if chat room already exists between these users
      const existingChat = await ChatRoom.findOne({
        participants: { $all: [matchRequest.sender, matchRequest.receiver] },
      });

      if (!existingChat) {
        await ChatRoom.create({
          participants: [matchRequest.sender, matchRequest.receiver],
          match: matchRequest._id,
        });

        logger.info(`Chat room created for match: ${requestId}`);
      }

      // Increment interest count on room if linked
      if (matchRequest.room) {
        await RoomListing.findByIdAndUpdate(matchRequest.room, {
          $inc: { interestCount: 1 },
        });
      }
    }

    // Populate for response
    await matchRequest.populate("sender", "name avatar age gender occupation city isVerified");
    await matchRequest.populate("receiver", "name avatar age gender occupation city isVerified");

    logger.info(`Match request ${requestId} ${newStatus} by ${userId}`);

    // Trigger Notification to sender
    const statusText = newStatus === MatchRequestStatus.ACCEPTED ? "accepted" : "rejected";
    NotificationProducer.publishNotification({
      recipient: matchRequest.sender,
      sender: userId,
      type: NotificationType.MATCH,
      title: `Match Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      message: `${matchRequest.receiver.name} has ${statusText} your match request.`,
      refModel: "MatchRequest",
      refId: matchRequest._id,
    });

    return matchRequest;
  }

  /**
   * Cancel a pending match request.
   * Only the sender can cancel.
   */
  static async cancelRequest(requestId, userId) {
    const matchRequest = await MatchRequest.findById(requestId);

    if (!matchRequest) {
      throw new ApiError(404, "Match request not found");
    }

    if (matchRequest.sender.toString() !== userId.toString()) {
      throw new ApiError(403, "Only the sender can cancel this request");
    }

    if (matchRequest.status !== MatchRequestStatus.PENDING) {
      throw new ApiError(400, `Cannot cancel a request that has been ${matchRequest.status}`);
    }

    await MatchRequest.findByIdAndDelete(requestId);

    logger.info(`Match request cancelled: ${requestId}`);

    return { message: "Match request cancelled successfully" };
  }

  /**
   * Get received match requests with optional status filter.
   */
  static async getReceivedRequests(userId, queryParams = {}) {
    const { status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;

    const filter = { receiver: userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [requests, totalCount] = await Promise.all([
      MatchRequest.find(filter)
        .populate("sender", "name avatar age gender occupation city budgetMin budgetMax lifestyleHabits isVerified")
        .populate("room", "title rent city images roomType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      MatchRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      requests,
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
   * Get sent match requests with optional status filter.
   */
  static async getSentRequests(userId, queryParams = {}) {
    const { status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;

    const filter = { sender: userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [requests, totalCount] = await Promise.all([
      MatchRequest.find(filter)
        .populate("receiver", "name avatar age gender occupation city budgetMin budgetMax lifestyleHabits isVerified")
        .populate("room", "title rent city images roomType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      MatchRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      requests,
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
   * Get all accepted matches (connections).
   * Returns the other user's profile for each match.
   */
  static async getMyMatches(userId, queryParams = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;

    const filter = {
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
      status: MatchRequestStatus.ACCEPTED,
    };

    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [matches, totalCount] = await Promise.all([
      MatchRequest.find(filter)
        .populate("sender", "name avatar age gender occupation city lifestyleHabits isVerified")
        .populate("receiver", "name avatar age gender occupation city lifestyleHabits isVerified")
        .populate("room", "title rent city images")
        .sort({ respondedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      MatchRequest.countDocuments(filter),
    ]);

    // Transform: return the OTHER user as the "matchedUser"
    const formattedMatches = matches.map((match) => {
      const isSender = match.sender._id.toString() === userId.toString();
      return {
        _id: match._id,
        matchedUser: isSender ? match.receiver : match.sender,
        room: match.room,
        compatibilityScore: match.compatibilityScore,
        scoreBreakdown: match.scoreBreakdown,
        matchedAt: match.respondedAt,
        message: match.message,
      };
    });

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      matches: formattedMatches,
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
   * Unmatch — remove an accepted connection.
   * Deactivates the associated chat room.
   */
  static async unmatch(matchId, userId) {
    const match = await MatchRequest.findById(matchId);

    if (!match) {
      throw new ApiError(404, "Match not found");
    }

    // Verify user is part of this match
    const isSender = match.sender.toString() === userId.toString();
    const isReceiver = match.receiver.toString() === userId.toString();

    if (!isSender && !isReceiver) {
      throw new ApiError(403, "You are not part of this match");
    }

    if (match.status !== MatchRequestStatus.ACCEPTED) {
      throw new ApiError(400, "Can only unmatch accepted connections");
    }

    // Deactivate the associated chat room
    await ChatRoom.findOneAndUpdate(
      { match: matchId },
      { isActive: false }
    );

    // Delete the match request
    await MatchRequest.findByIdAndDelete(matchId);

    logger.info(`User ${userId} unmatched from match: ${matchId}`);

    return { message: "Unmatched successfully" };
  }

  /**
   * Get recommended roommates sorted by compatibility score.
   * Excludes users already matched or with pending requests.
   */
  static async getRecommendedRoommates(userId, queryParams = {}) {
    const { city, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new ApiError(404, "User not found");
    }

    // Get IDs of users already connected or with pending requests
    const existingRequestUsers = await MatchRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: { $in: [MatchRequestStatus.PENDING, MatchRequestStatus.ACCEPTED] },
    }).select("sender receiver");

    const excludeIds = new Set([userId.toString()]);
    existingRequestUsers.forEach((req) => {
      excludeIds.add(req.sender.toString());
      excludeIds.add(req.receiver.toString());
    });

    // Filter potential roommates
    const filter = {
      _id: { $nin: Array.from(excludeIds) },
      isActive: true,
      isBlocked: false,
    };

    if (city) {
      filter.city = { $regex: new RegExp(city, "i") };
    }

    // Fetch candidates
    const candidates = await User.find(filter)
      .select("name avatar age gender occupation city state budgetMin budgetMax lifestyleHabits lookingFor moveInTimeline preferredLocations languages isVerified createdAt")
      .lean();

    // Calculate compatibility for each candidate
    const scoredCandidates = candidates.map((candidate) => {
      const { score, breakdown } = MatchService.#calculateCompatibility(currentUser, candidate);
      return {
        user: candidate,
        compatibilityScore: score,
        scoreBreakdown: breakdown,
      };
    });

    // Sort by compatibility score (highest first)
    scoredCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Paginate
    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, 20);
    const paginated = scoredCandidates.slice(skip, skip + effectiveLimit);
    const totalCount = scoredCandidates.length;
    const totalPages = Math.ceil(totalCount / effectiveLimit);

    return {
      roommates: paginated,
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
   * Get match request stats for the current user.
   */
  static async getMatchStats(userId) {
    const [pendingReceived, pendingSent, totalMatches] = await Promise.all([
      MatchRequest.countDocuments({ receiver: userId, status: MatchRequestStatus.PENDING }),
      MatchRequest.countDocuments({ sender: userId, status: MatchRequestStatus.PENDING }),
      MatchRequest.countDocuments({
        $or: [{ sender: userId }, { receiver: userId }],
        status: MatchRequestStatus.ACCEPTED,
      }),
    ]);

    return {
      pendingReceived,
      pendingSent,
      totalMatches,
    };
  }

  /**
   * Get compatibility score between the current user and a target user.
   * Used on profile view — "85% compatible with you".
   */
  static async getCompatibilityWith(userId, targetUserId) {
    if (userId.toString() === targetUserId.toString()) {
      throw new ApiError(400, "Cannot check compatibility with yourself");
    }

    const [userA, userB] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
    ]);

    if (!userB) {
      throw new ApiError(404, "User not found");
    }

    const { score, breakdown } = MatchService.#calculateCompatibility(userA, userB);

    return {
      compatibilityScore: score,
      scoreBreakdown: breakdown,
      targetUser: {
        _id: userB._id,
        name: userB.name,
        avatar: userB.avatar,
        city: userB.city,
      },
    };
  }
}

export default MatchService;
