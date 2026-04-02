/**
 * Admin Controller
 *
 * REST mapping for administrative dashboard and moderation.
 */
import AdminService from "../services/admin.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class AdminController {
  /**
   * GET /api/v1/admin/dashboard/stats
   * Fetch overall platform metrics.
   */
  static getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await AdminService.getDashboardStats();

    res
      .status(200)
      .json(new ApiResponse(200, { stats }, "Dashboard stats fetched successfully"));
  });

  /**
   * GET /api/v1/admin/users
   * List all users with administrative filters.
   */
  static getAllUsers = asyncHandler(async (req, res) => {
    const result = await AdminService.getAllUsers(req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "All users fetched successfully"));
  });

  /**
   * PATCH /api/v1/admin/users/:id
   * Update user status (Verify, Block, Role).
   */
  static updateUserModeration = asyncHandler(async (req, res) => {
    const updatedUser = await AdminService.updateUserModeration(
      req.params.id,
      req.body
    );

    res
      .status(200)
      .json(new ApiResponse(200, { updatedUser }, "User updated successfully"));
  });

  /**
   * GET /api/v1/admin/listings
   * List all rooms with administrative filters.
   */
  static getAllListings = asyncHandler(async (req, res) => {
    const result = await AdminService.getAllListings(req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "All listings fetched successfully"));
  });

  /**
   * PATCH /api/v1/admin/listings/:id
   * Update listing status or featured flag.
   */
  static updateListingModeration = asyncHandler(async (req, res) => {
    const updatedListing = await AdminService.updateListingModeration(
      req.params.id,
      req.body
    );

    res
      .status(200)
      .json(new ApiResponse(200, { updatedListing }, "Listing updated successfully"));
  });
}

export default AdminController;
