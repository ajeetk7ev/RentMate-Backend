/**
 * Room Listing Controller
 *
 * Thin HTTP layer for room listing management.
 * All business logic lives in RoomService.
 */
import RoomService from "../services/room.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class RoomController {
  /**
   * POST /api/v1/rooms
   * Create a new room listing
   */
  static createRoom = asyncHandler(async (req, res) => {
    const room = await RoomService.createRoom(req.user._id, req.user.role, req.body);

    res
      .status(201)
      .json(new ApiResponse(201, { room }, "Room listing created successfully"));
  });

  /**
   * PUT /api/v1/rooms/:id
   * Update a room listing
   */
  static updateRoom = asyncHandler(async (req, res) => {
    const room = await RoomService.updateRoom(req.params.id, req.user._id, req.body);

    res
      .status(200)
      .json(new ApiResponse(200, { room }, "Room listing updated successfully"));
  });

  /**
   * DELETE /api/v1/rooms/:id
   * Delete a room listing
   */
  static deleteRoom = asyncHandler(async (req, res) => {
    const result = await RoomService.deleteRoom(req.params.id, req.user._id, req.user.role);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Room listing deleted successfully"));
  });

  /**
   * POST /api/v1/rooms/:id/images
   * Upload images for a room listing
   */
  static uploadImages = asyncHandler(async (req, res) => {
    const room = await RoomService.uploadImages(req.params.id, req.user._id, req.files);

    res
      .status(200)
      .json(new ApiResponse(200, { room }, "Images uploaded successfully"));
  });

  /**
   * DELETE /api/v1/rooms/:id/images/:imageId
   * Delete a specific image from a listing
   */
  static deleteImage = asyncHandler(async (req, res) => {
    const room = await RoomService.deleteImage(
      req.params.id,
      req.user._id,
      req.params.imageId
    );

    res
      .status(200)
      .json(new ApiResponse(200, { room }, "Image deleted successfully"));
  });

  /**
   * GET /api/v1/rooms/:id
   * Get a single room listing
   */
  static getRoomById = asyncHandler(async (req, res) => {
    // Pass viewer's userId if authenticated (to skip view count for owner)
    const viewerUserId = req.user?._id || null;
    const room = await RoomService.getRoomById(req.params.id, viewerUserId);

    res
      .status(200)
      .json(new ApiResponse(200, { room }, "Room listing fetched successfully"));
  });

  /**
   * GET /api/v1/rooms
   * Search rooms with filters and pagination
   */
  static searchRooms = asyncHandler(async (req, res) => {
    const result = await RoomService.searchRooms(req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Rooms fetched successfully"));
  });

  /**
   * GET /api/v1/rooms/my-listings
   * Get own listings (authenticated)
   */
  static getMyListings = asyncHandler(async (req, res) => {
    const result = await RoomService.getMyListings(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Your listings fetched successfully"));
  });

  /**
   * PATCH /api/v1/rooms/:id/status
   * Update listing status
   */
  static updateStatus = asyncHandler(async (req, res) => {
    const room = await RoomService.updateStatus(
      req.params.id,
      req.user._id,
      req.body.status
    );

    res
      .status(200)
      .json(new ApiResponse(200, { room }, "Listing status updated successfully"));
  });

  /**
   * GET /api/v1/rooms/nearby
   * Find rooms near a location
   */
  static getNearbyRooms = asyncHandler(async (req, res) => {
    const { lng, lat, radius } = req.query;
    const result = await RoomService.getNearbyRooms(lng, lat, radius, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Nearby rooms fetched successfully"));
  });
}

export default RoomController;
