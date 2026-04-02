/**
 * User Controller
 *
 * Thin HTTP layer for user profile management.
 * All business logic lives in UserService.
 */
import UserService from "../services/user.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class UserController {
  /**
   * PUT /api/v1/users/profile
   * Update authenticated user's profile
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const user = await UserService.updateProfile(req.user._id, req.body);

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "Profile updated successfully"));
  });

  /**
   * POST /api/v1/users/avatar
   * Upload or update user avatar
   */
  static uploadAvatar = asyncHandler(async (req, res) => {
    const user = await UserService.uploadAvatar(req.user._id, req.file?.buffer);

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "Avatar uploaded successfully"));
  });

  /**
   * DELETE /api/v1/users/avatar
   * Remove user avatar
   */
  static removeAvatar = asyncHandler(async (req, res) => {
    const user = await UserService.removeAvatar(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "Avatar removed successfully"));
  });

  /**
   * GET /api/v1/users/profile
   * Get own full profile
   */
  static getOwnProfile = asyncHandler(async (req, res) => {
    const user = await UserService.getOwnProfile(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "Profile fetched successfully"));
  });

  /**
   * GET /api/v1/users/:id
   * Get another user's public profile
   */
  static getPublicProfile = asyncHandler(async (req, res) => {
    const user = await UserService.getPublicProfile(req.params.id);

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "Profile fetched successfully"));
  });

  /**
   * GET /api/v1/users/browse
   * Browse roommate profiles with filters
   */
  static browseProfiles = asyncHandler(async (req, res) => {
    const result = await UserService.browseProfiles(req.user._id, req.query);

    res
      .status(200)
      .json(
        new ApiResponse(200, result, "Profiles fetched successfully")
      );
  });

  /**
   * PATCH /api/v1/users/deactivate
   * Deactivate own account (soft delete)
   */
  static deactivateAccount = asyncHandler(async (req, res) => {
    const result = await UserService.deactivateAccount(req.user._id);

    // Clear auth cookie
    res
      .status(200)
      .cookie("accessToken", "", { httpOnly: true, maxAge: 0 })
      .json(new ApiResponse(200, result, "Account deactivated successfully"));
  });

  /**
   * DELETE /api/v1/users/account
   * Permanently delete account
   */
  static deleteAccount = asyncHandler(async (req, res) => {
    const result = await UserService.deleteAccount(req.user._id);

    // Clear auth cookie
    res
      .status(200)
      .cookie("accessToken", "", { httpOnly: true, maxAge: 0 })
      .json(new ApiResponse(200, result, "Account deleted permanently"));
  });
}

export default UserController;
