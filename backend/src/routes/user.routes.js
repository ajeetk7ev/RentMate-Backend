/**
 * User Routes
 *
 * PUT    /api/v1/users/profile     - Update own profile
 * GET    /api/v1/users/profile     - Get own full profile
 * POST   /api/v1/users/avatar      - Upload/update avatar
 * DELETE /api/v1/users/avatar      - Remove avatar
 * GET    /api/v1/users/browse      - Browse roommate profiles (with filters)
 * PATCH  /api/v1/users/deactivate  - Deactivate own account
 * DELETE /api/v1/users/account     - Permanently delete account
 * GET    /api/v1/users/:id         - Get a user's public profile
 */
import { Router } from "express";

import UserController from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { uploadSingle } from "../middlewares/multer.middleware.js";
import { updateProfileSchema, browseProfilesSchema } from "../validations/user.validation.js";

const router = Router();

// All user routes require authentication
router.use(isAuthenticated);

// Profile management
router
  .route("/profile")
  .get(UserController.getOwnProfile)
  .put(validate(updateProfileSchema), UserController.updateProfile);

// Avatar management
router
  .route("/avatar")
  .post(uploadSingle, UserController.uploadAvatar)
  .delete(UserController.removeAvatar);

// Browse roommate profiles
router.get("/browse", validateQuery(browseProfilesSchema), UserController.browseProfiles);

// Account management
router.patch("/deactivate", UserController.deactivateAccount);
router.delete("/account", UserController.deleteAccount);

// Public profile (must be last — :id is a catch-all param)
router.get("/:id", UserController.getPublicProfile);

export default router;
