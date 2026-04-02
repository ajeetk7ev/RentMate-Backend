/**
 * Search & Discovery Routes
 *
 * All search routes are public (no auth required).
 *
 * GET /api/v1/search/rooms         - Advanced search with filters & facets
 * GET /api/v1/search/cities        - City autocomplete suggestions
 * GET /api/v1/search/trending      - Trending / popular rooms
 * GET /api/v1/search/recent        - Recently added rooms
 * GET /api/v1/search/featured      - Featured high-quality rooms
 * GET /api/v1/search/metadata      - Available filters & price ranges
 * GET /api/v1/search/similar/:roomId - Similar rooms to a given room
 */
import { Router } from "express";

import SearchController from "../controllers/search.controller.js";
import { validateQuery } from "../middlewares/validate.middleware.js";

import {
  advancedSearchSchema,
  citySuggestionsSchema,
  discoveryQuerySchema,
  similarRoomsSchema,
} from "../validations/search.validation.js";

const router = Router();

// Advanced search with full-text, filters, and faceted counts
router.get("/rooms", validateQuery(advancedSearchSchema), SearchController.searchRooms);

// City autocomplete
router.get("/cities", validateQuery(citySuggestionsSchema), SearchController.getCitySuggestions);

// Discovery endpoints (homepage sections)
router.get("/trending", validateQuery(discoveryQuerySchema), SearchController.getTrendingRooms);
router.get("/recent", validateQuery(discoveryQuerySchema), SearchController.getRecentlyAdded);
router.get("/featured", validateQuery(discoveryQuerySchema), SearchController.getFeaturedRooms);

// Search metadata (initial page load)
router.get("/metadata", SearchController.getSearchMetadata);

// Similar rooms (room detail page)
router.get("/similar/:roomId", validateQuery(similarRoomsSchema), SearchController.getSimilarRooms);

export default router;
