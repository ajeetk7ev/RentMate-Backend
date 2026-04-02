/**
 * Room Listing Routes
 *
 * GET    /api/v1/rooms               - Search rooms (public)
 * GET    /api/v1/rooms/nearby        - Find nearby rooms (public)
 * GET    /api/v1/rooms/my-listings   - Get own listings (auth)
 * POST   /api/v1/rooms               - Create a room listing (auth, owner)
 * GET    /api/v1/rooms/:id           - Get single room (public, optional auth)
 * PUT    /api/v1/rooms/:id           - Update room listing (auth, owner)
 * DELETE /api/v1/rooms/:id           - Delete room listing (auth, owner)
 * PATCH  /api/v1/rooms/:id/status    - Update listing status (auth, owner)
 * POST   /api/v1/rooms/:id/images    - Upload room images (auth, owner)
 * DELETE /api/v1/rooms/:id/images/:imageId - Delete a room image (auth, owner)
 */
import { Router } from "express";

import RoomController from "../controllers/room.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import { uploadMultiple } from "../middlewares/multer.middleware.js";

import {
  createRoomSchema,
  updateRoomSchema,
  searchRoomsQuerySchema,
  myListingsQuerySchema,
  updateStatusSchema,
  nearbyRoomsQuerySchema,
} from "../validations/room.validation.js";

const router = Router();

// Optional auth middleware — authenticates if token present, otherwise continues
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (token) {
    return isAuthenticated(req, res, next);
  }
  next();
};

// Public routes
router.get("/", validateQuery(searchRoomsQuerySchema), RoomController.searchRooms);
router.get("/nearby", validateQuery(nearbyRoomsQuerySchema), RoomController.getNearbyRooms);

// Protected routes (must come BEFORE /:id to avoid being caught as a param)
router.get("/my-listings", isAuthenticated, validateQuery(myListingsQuerySchema), RoomController.getMyListings);
router.post("/", isAuthenticated, validate(createRoomSchema), RoomController.createRoom);

// Optionally authenticated — pass viewer userId for smart view count
router.get("/:id", optionalAuth, RoomController.getRoomById);

// Protected parameterized routes
router.put("/:id", isAuthenticated, validate(updateRoomSchema), RoomController.updateRoom);
router.delete("/:id", isAuthenticated, RoomController.deleteRoom);
router.patch("/:id/status", isAuthenticated, validate(updateStatusSchema), RoomController.updateStatus);
router.post("/:id/images", isAuthenticated, uploadMultiple, RoomController.uploadImages);
router.delete("/:id/images/:imageId", isAuthenticated, RoomController.deleteImage);

export default router;
