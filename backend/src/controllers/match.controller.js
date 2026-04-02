/**
 * Match Controller
 *
 * Thin HTTP layer for roommate matching system.
 * All business logic lives in MatchService.
 */
import MatchService from "../services/match.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class MatchController {
  /**
   * POST /api/v1/matches/request
   * Send a match/interest request
   */
  static sendRequest = asyncHandler(async (req, res) => {
    const matchRequest = await MatchService.sendRequest(req.user._id, req.body);

    res
      .status(201)
      .json(new ApiResponse(201, { matchRequest }, "Match request sent successfully"));
  });

  /**
   * PATCH /api/v1/matches/:id/respond
   * Accept or reject a match request
   */
  static respondToRequest = asyncHandler(async (req, res) => {
    const matchRequest = await MatchService.respondToRequest(
      req.params.id,
      req.user._id,
      req.body.status
    );

    const message = req.body.status === "accepted"
      ? "Match request accepted. You can now chat!"
      : "Match request rejected";

    res
      .status(200)
      .json(new ApiResponse(200, { matchRequest }, message));
  });

  /**
   * DELETE /api/v1/matches/:id/cancel
   * Cancel a pending match request (sender only)
   */
  static cancelRequest = asyncHandler(async (req, res) => {
    const result = await MatchService.cancelRequest(req.params.id, req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Match request cancelled"));
  });

  /**
   * GET /api/v1/matches/received
   * Get received match requests
   */
  static getReceivedRequests = asyncHandler(async (req, res) => {
    const result = await MatchService.getReceivedRequests(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Received requests fetched successfully"));
  });

  /**
   * GET /api/v1/matches/sent
   * Get sent match requests
   */
  static getSentRequests = asyncHandler(async (req, res) => {
    const result = await MatchService.getSentRequests(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Sent requests fetched successfully"));
  });

  /**
   * GET /api/v1/matches/connections
   * Get all accepted matches (connections)
   */
  static getMyMatches = asyncHandler(async (req, res) => {
    const result = await MatchService.getMyMatches(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Matches fetched successfully"));
  });

  /**
   * DELETE /api/v1/matches/:id/unmatch
   * Unmatch / remove a connection
   */
  static unmatch = asyncHandler(async (req, res) => {
    const result = await MatchService.unmatch(req.params.id, req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Unmatched successfully"));
  });

  /**
   * GET /api/v1/matches/recommended
   * Get recommended roommates (sorted by compatibility)
   */
  static getRecommendedRoommates = asyncHandler(async (req, res) => {
    const result = await MatchService.getRecommendedRoommates(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Recommended roommates fetched successfully"));
  });

  /**
   * GET /api/v1/matches/stats
   * Get match request stats
   */
  static getMatchStats = asyncHandler(async (req, res) => {
    const stats = await MatchService.getMatchStats(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, { stats }, "Match stats fetched"));
  });

  /**
   * GET /api/v1/matches/compatibility/:userId
   * Get compatibility score with a specific user
   */
  static getCompatibilityWith = asyncHandler(async (req, res) => {
    const result = await MatchService.getCompatibilityWith(req.user._id, req.params.userId);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Compatibility score calculated"));
  });
}

export default MatchController;
