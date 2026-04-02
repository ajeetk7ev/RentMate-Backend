/**
 * Auth Middleware
 *
 * Protects routes by verifying JWT from cookies.
 * Attaches the authenticated user to req.user.
 */
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import env from "../config/env.js";

/**
 * isAuthenticated - Verifies JWT token from cookies.
 * Attaches full user object (without password) to req.user.
 */
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Please login to access this resource");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded._id);

    if (!user) {
      throw new ApiError(401, "User not found. Please login again");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked. Contact support");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account is deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid or expired token. Please login again");
  }
});

/**
 * authorizeRoles - Restricts access to specific roles.
 *
 * Usage:
 *   router.get("/admin/users", isAuthenticated, authorizeRoles("admin"), getUsers);
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user.role}' is not allowed to access this resource`
      );
    }
    next();
  };
};
