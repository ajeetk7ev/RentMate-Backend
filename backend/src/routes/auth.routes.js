/**
 * Auth Routes
 *
 * POST   /api/v1/auth/signup            - Register new user
 * POST   /api/v1/auth/login             - Login user
 * POST   /api/v1/auth/logout            - Logout user
 * GET    /api/v1/auth/me                - Get current user
 * POST   /api/v1/auth/forgot-password   - Send password reset email
 * POST   /api/v1/auth/reset-password/:token  - Reset password via token
 * PUT    /api/v1/auth/change-password   - Change password (authenticated)
 * GET    /api/v1/auth/google            - Initiate Google OAuth
 * GET    /api/v1/auth/google/callback   - Google OAuth callback
 */
import { Router } from "express";
import passport from "passport";

import AuthController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validations/auth.validation.js";

const router = Router();

// Public routes
router.post("/signup", validate(signupSchema), AuthController.signup);
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), AuthController.resetPassword);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/google/failure`,
  }),
  AuthController.googleCallback
);

// Protected routes (requires authentication)
router.get("/me", isAuthenticated, AuthController.getMe);
router.put("/change-password", isAuthenticated, validate(changePasswordSchema), AuthController.changePassword);

export default router;
