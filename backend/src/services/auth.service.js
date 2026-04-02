/**
 * Auth Service
 *
 * Contains all business logic for authentication.
 * Controllers call these methods and handle HTTP responses.
 */
import crypto from "crypto";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import EmailService from "./email.service.js";
import logger from "../config/logger.js";

class AuthService {
  /**
   * Register a new user with email/phone + password.
   * @returns {Object} created user document
   */
  static async signup({ name, email, phone, password, role }) {
    // Check if email already exists
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new ApiError(409, "An account with this email already exists");
      }
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        throw new ApiError(409, "An account with this phone number already exists");
      }
    }

    // Create user
    const user = await User.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      password,
      role,
      authProvider: "local",
      lastLogin: new Date(),
    });

    // Send welcome email asynchronously (non-blocking)
    if (email) {
      EmailService.sendWelcomeEmail(email, name).catch((err) =>
        logger.error(`Failed to send welcome email: ${err.message}`)
      );
    }

    logger.info(`New user registered: ${email || phone}`);

    return user;
  }

  /**
   * Authenticate user with email/phone + password.
   * @returns {Object} authenticated user document
   */
  static async login({ email, phone, password }) {
    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ email }).select("+password");
    } else if (phone) {
      user = await User.findOne({ phone }).select("+password");
    }

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Check if user signed up via Google (no password set)
    if (!user.password) {
      throw new ApiError(
        401,
        "This account uses Google login. Please sign in with Google"
      );
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked. Contact support");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account is deactivated");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email || phone}`);

    return user;
  }

  /**
   * Get user by ID.
   * @returns {Object} user document
   */
  static async getUserById(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Initiate forgot password flow — generate token and send reset email.
   * @returns {boolean} true if email sent successfully
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "No account found with this email");
    }

    if (user.authProvider === "google" && !user.password) {
      throw new ApiError(
        400,
        "This account uses Google login. Password reset is not available"
      );
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const emailSent = await EmailService.sendResetPasswordEmail(email, resetToken);

    if (!emailSent) {
      // Clear token if email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      throw new ApiError(500, "Failed to send reset email. Please try again later");
    }

    logger.info(`Password reset email sent to: ${email}`);

    return true;
  }

  /**
   * Reset password using token from email.
   * @returns {Object} user document with new password
   */
  static async resetPassword(token, newPassword) {
    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    // Set new password and clear reset fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);

    return user;
  }

  /**
   * Change password for an authenticated user.
   * @returns {Object} user document with updated password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.authProvider === "google" && !user.password) {
      throw new ApiError(
        400,
        "This account uses Google login. Please set a password first"
      );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email || user.phone}`);

    return user;
  }

  /**
   * Handle Google OAuth user — validate and return user.
   * @returns {Object} user document
   */
  static async handleGoogleUser(user) {
    if (!user) {
      throw new ApiError(401, "Google authentication failed");
    }

    return user;
  }
}

export default AuthService;
