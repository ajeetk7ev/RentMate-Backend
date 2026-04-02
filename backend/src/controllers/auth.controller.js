/**
 * Auth Controller
 *
 * Thin HTTP layer — handles request/response only.
 * All business logic lives in AuthService.
 */
import AuthService from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import env from "../config/env.js";

class AuthController {
  // Private: cookie options for JWT token
  static #getCookieOptions() {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    };
  }

  // Private: set token cookie and send response
  static #sendTokenResponse(res, user, statusCode, message) {
    const token = user.generateAccessToken();

    const userData = user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpire;

    res
      .status(statusCode)
      .cookie("accessToken", token, AuthController.#getCookieOptions())
      .json(new ApiResponse(statusCode, { user: userData }, message));
  }

  /**
   * POST /api/v1/auth/signup
   */
  static signup = asyncHandler(async (req, res) => {
    const user = await AuthService.signup(req.body);

    AuthController.#sendTokenResponse(res, user, 201, "Account created successfully");
  });

  /**
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req, res) => {
    const user = await AuthService.login(req.body);

    AuthController.#sendTokenResponse(res, user, 200, "Logged in successfully");
  });

  /**
   * GET /api/v1/auth/google/callback
   */
  static googleCallback = asyncHandler(async (req, res) => {
    const user = await AuthService.handleGoogleUser(req.user);
    const token = user.generateAccessToken();

    res
      .cookie("accessToken", token, AuthController.#getCookieOptions())
      .redirect(`${env.FRONTEND_URL}/auth/google/success`);
  });

  /**
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req, res) => {
    res
      .status(200)
      .cookie("accessToken", "", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 0,
      })
      .json(new ApiResponse(200, null, "Logged out successfully"));
  });

  /**
   * GET /api/v1/auth/me
   */
  static getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getUserById(req.user._id);

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "User profile fetched successfully"));
  });

  /**
   * POST /api/v1/auth/forgot-password
   */
  static forgotPassword = asyncHandler(async (req, res) => {
    await AuthService.forgotPassword(req.body.email);

    res
      .status(200)
      .json(
        new ApiResponse(200, null, "Password reset link has been sent to your email")
      );
  });

  /**
   * POST /api/v1/auth/reset-password/:token
   */
  static resetPassword = asyncHandler(async (req, res) => {
    const user = await AuthService.resetPassword(req.params.token, req.body.password);

    AuthController.#sendTokenResponse(res, user, 200, "Password reset successful");
  });

  /**
   * PUT /api/v1/auth/change-password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await AuthService.changePassword(req.user._id, currentPassword, newPassword);

    AuthController.#sendTokenResponse(res, user, 200, "Password changed successfully");
  });
}

export default AuthController;
