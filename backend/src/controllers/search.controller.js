/**
 * Search & Discovery Controller
 *
 * Thin HTTP layer for room search and discovery.
 * All business logic lives in SearchService.
 */
import SearchService from "../services/search.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class SearchController {
  /**
   * GET /api/v1/search/rooms
   * Advanced room search with full-text, filters, facets, and pagination
   */
  static searchRooms = asyncHandler(async (req, res) => {
    const result = await SearchService.advancedSearch(req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Search results fetched successfully"));
  });

  /**
   * GET /api/v1/search/cities
   * City autocomplete suggestions
   */
  static getCitySuggestions = asyncHandler(async (req, res) => {
    const cities = await SearchService.getCitySuggestions(req.query.q);

    res
      .status(200)
      .json(new ApiResponse(200, { cities }, "City suggestions fetched successfully"));
  });

  /**
   * GET /api/v1/search/trending
   * Get trending / popular rooms
   */
  static getTrendingRooms = asyncHandler(async (req, res) => {
    const rooms = await SearchService.getTrendingRooms(req.query);

    res
      .status(200)
      .json(new ApiResponse(200, { rooms }, "Trending rooms fetched successfully"));
  });

  /**
   * GET /api/v1/search/recent
   * Get recently added rooms (last 7 days)
   */
  static getRecentlyAdded = asyncHandler(async (req, res) => {
    const rooms = await SearchService.getRecentlyAdded(req.query);

    res
      .status(200)
      .json(new ApiResponse(200, { rooms }, "Recent rooms fetched successfully"));
  });

  /**
   * GET /api/v1/search/similar/:roomId
   * Get rooms similar to a given room
   */
  static getSimilarRooms = asyncHandler(async (req, res) => {
    const rooms = await SearchService.getSimilarRooms(req.params.roomId, req.query.limit);

    res
      .status(200)
      .json(new ApiResponse(200, { rooms }, "Similar rooms fetched successfully"));
  });

  /**
   * GET /api/v1/search/metadata
   * Get search metadata (available filters, price ranges, city counts)
   */
  static getSearchMetadata = asyncHandler(async (req, res) => {
    const metadata = await SearchService.getSearchMetadata();

    res
      .status(200)
      .json(new ApiResponse(200, { metadata }, "Search metadata fetched successfully"));
  });

  /**
   * GET /api/v1/search/featured
   * Get featured / high-quality rooms for homepage
   */
  static getFeaturedRooms = asyncHandler(async (req, res) => {
    const rooms = await SearchService.getFeaturedRooms(req.query.limit);

    res
      .status(200)
      .json(new ApiResponse(200, { rooms }, "Featured rooms fetched successfully"));
  });
}

export default SearchController;
