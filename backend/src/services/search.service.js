/**
 * Search & Discovery Service
 *
 * Production-grade search with:
 * - Full-text search with relevance scoring
 * - Advanced multi-filter queries
 * - Faceted counts (how many rooms per filter value)
 * - City autocomplete suggestions
 * - Trending / popular rooms
 * - Recently added rooms
 * - Similar rooms recommendation
 * - Search metadata (available filters, price ranges)
 */
import RoomListing from "../models/roomListing.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ListingStatus, PAGINATION } from "../utils/constants.js";
import logger from "../config/logger.js";

class SearchService {
  /**
   * Advanced room search with full-text, filters, and faceted counts.
   *
   * Key UX features:
   * - Text query searches across title, description, address, city
   * - Returns faceted counts so frontend can show filter badges (e.g. "Furnished (12)")
   * - Returns applied filters back to frontend for easy filter chip display
   * - Price range metadata for slider UI
   */
  static async advancedSearch(queryParams) {
    const {
      q,                  // text search query
      city,
      budgetMin,
      budgetMax,
      roomType,
      genderPreference,
      furnishing,
      amenities,
      availableFrom,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = "relevance",
    } = queryParams;

    // Build filter
    const filter = { status: ListingStatus.ACTIVE };

    // Full-text search
    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    // City filter (case-insensitive partial match)
    if (city) {
      filter.city = { $regex: new RegExp(city, "i") };
    }

    // Budget range
    if (budgetMin !== undefined || budgetMax !== undefined) {
      filter.rent = {};
      if (budgetMin !== undefined) filter.rent.$gte = Number(budgetMin);
      if (budgetMax !== undefined) filter.rent.$lte = Number(budgetMax);
    }

    if (roomType) filter.roomType = roomType;
    if (genderPreference) filter.genderPreference = genderPreference;
    if (furnishing) filter.furnishing = furnishing;

    // Amenities — support comma-separated string or array
    if (amenities) {
      const amenityList = Array.isArray(amenities)
        ? amenities
        : amenities.split(",").map((a) => a.trim()).filter(Boolean);

      if (amenityList.length > 0) {
        filter.amenities = { $all: amenityList };
      }
    }

    // Available from — rooms available on or before this date
    if (availableFrom) {
      filter.availableFrom = { $lte: new Date(availableFrom) };
    }

    // Sort options
    let sortBy;
    switch (sort) {
      case "relevance":
        // Only use text score sort when there's a text query
        sortBy = q ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 };
        break;
      case "price_low":
        sortBy = { rent: 1, createdAt: -1 };
        break;
      case "price_high":
        sortBy = { rent: -1, createdAt: -1 };
        break;
      case "popular":
        sortBy = { viewCount: -1, interestCount: -1, createdAt: -1 };
        break;
      case "oldest":
        sortBy = { createdAt: 1 };
        break;
      case "latest":
      default:
        sortBy = { createdAt: -1 };
        break;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Build projection (include text score when doing text search)
    const projection = q ? { score: { $meta: "textScore" } } : {};

    // Execute search + count + facets in parallel
    const [rooms, totalCount, facets] = await Promise.all([
      RoomListing.find(filter, projection)
        .populate("owner", "name avatar isVerified")
        .sort(sortBy)
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),

      RoomListing.countDocuments(filter),

      SearchService.#getFacetedCounts(filter),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

    // Collect applied filters for frontend display
    const appliedFilters = {};
    if (q) appliedFilters.q = q;
    if (city) appliedFilters.city = city;
    if (budgetMin !== undefined) appliedFilters.budgetMin = budgetMin;
    if (budgetMax !== undefined) appliedFilters.budgetMax = budgetMax;
    if (roomType) appliedFilters.roomType = roomType;
    if (genderPreference) appliedFilters.genderPreference = genderPreference;
    if (furnishing) appliedFilters.furnishing = furnishing;
    if (amenities) appliedFilters.amenities = amenities;
    if (availableFrom) appliedFilters.availableFrom = availableFrom;

    return {
      rooms,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit: effectiveLimit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      facets,
      appliedFilters,
      sort,
    };
  }

  /**
   * Get faceted counts for active filter values.
   * Returns count per roomType, furnishing, genderPreference.
   * Powers the filter sidebar with counts like "Private (24)".
   */
  static async #getFacetedCounts(baseFilter) {
    // Clone filter without the specific field we're faceting on
    const buildFacetFilter = (excludeField) => {
      const f = { ...baseFilter };
      delete f[excludeField];
      return f;
    };

    const [roomTypeFacets, furnishingFacets, genderFacets, priceStats] = await Promise.all([
      // Room type counts
      RoomListing.aggregate([
        { $match: buildFacetFilter("roomType") },
        { $group: { _id: "$roomType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Furnishing counts
      RoomListing.aggregate([
        { $match: buildFacetFilter("furnishing") },
        { $group: { _id: "$furnishing", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Gender preference counts
      RoomListing.aggregate([
        { $match: buildFacetFilter("genderPreference") },
        { $group: { _id: "$genderPreference", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Price range stats
      RoomListing.aggregate([
        { $match: { status: ListingStatus.ACTIVE } },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$rent" },
            maxPrice: { $max: "$rent" },
            avgPrice: { $avg: "$rent" },
          },
        },
      ]),
    ]);

    return {
      roomType: SearchService.#formatFacets(roomTypeFacets),
      furnishing: SearchService.#formatFacets(furnishingFacets),
      genderPreference: SearchService.#formatFacets(genderFacets),
      priceRange: priceStats[0]
        ? {
            min: Math.floor(priceStats[0].minPrice),
            max: Math.ceil(priceStats[0].maxPrice),
            avg: Math.round(priceStats[0].avgPrice),
          }
        : { min: 0, max: 0, avg: 0 },
    };
  }

  /**
   * Format aggregation facets into { value: count } object.
   */
  static #formatFacets(facetResults) {
    const formatted = {};
    facetResults.forEach((f) => {
      if (f._id) formatted[f._id] = f.count;
    });
    return formatted;
  }

  /**
   * City autocomplete — returns matching city names as user types.
   * Uses distinct + regex for fast prefix matching.
   */
  static async getCitySuggestions(query) {
    if (!query || query.trim().length < 2) {
      throw new ApiError(400, "Search query must be at least 2 characters");
    }

    const regex = new RegExp(`^${query.trim()}`, "i");

    // Get distinct cities matching the prefix, only from active listings
    const cities = await RoomListing.aggregate([
      {
        $match: {
          status: ListingStatus.ACTIVE,
          city: { $regex: regex },
        },
      },
      {
        $group: {
          _id: "$city",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          city: "$_id",
          listingCount: "$count",
        },
      },
    ]);

    return cities;
  }

  /**
   * Get trending rooms — sorted by engagement (views + interests).
   * Great for homepage "Popular Rooms" section.
   */
  static async getTrendingRooms(queryParams = {}) {
    const { city, limit = 10 } = queryParams;
    const effectiveLimit = Math.min(limit, 20);

    const filter = { status: ListingStatus.ACTIVE };
    if (city) filter.city = { $regex: new RegExp(city, "i") };

    const rooms = await RoomListing.find(filter)
      .populate("owner", "name avatar isVerified")
      .sort({ viewCount: -1, interestCount: -1, createdAt: -1 })
      .limit(effectiveLimit)
      .lean();

    return rooms;
  }

  /**
   * Get recently added rooms — newest listings first.
   * Great for homepage "Just Listed" section.
   */
  static async getRecentlyAdded(queryParams = {}) {
    const { city, limit = 10 } = queryParams;
    const effectiveLimit = Math.min(limit, 20);

    const filter = {
      status: ListingStatus.ACTIVE,
      // Only rooms added in the last 7 days
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };

    if (city) filter.city = { $regex: new RegExp(city, "i") };

    const rooms = await RoomListing.find(filter)
      .populate("owner", "name avatar isVerified")
      .sort({ createdAt: -1 })
      .limit(effectiveLimit)
      .lean();

    return rooms;
  }

  /**
   * Get rooms similar to a given room.
   * Matches on: same city, similar price range (+/- 30%), same room type.
   * Excludes the source room from results.
   */
  static async getSimilarRooms(roomId, limit = 6) {
    const sourceRoom = await RoomListing.findById(roomId).lean();

    if (!sourceRoom) {
      throw new ApiError(404, "Room not found");
    }

    const priceRange = sourceRoom.rent * 0.3;
    const effectiveLimit = Math.min(limit, 10);

    const filter = {
      _id: { $ne: sourceRoom._id },
      status: ListingStatus.ACTIVE,
      city: sourceRoom.city,
      rent: {
        $gte: sourceRoom.rent - priceRange,
        $lte: sourceRoom.rent + priceRange,
      },
    };

    // Try to match room type, but fallback to just city + price if no results
    let rooms = await RoomListing.find({ ...filter, roomType: sourceRoom.roomType })
      .populate("owner", "name avatar isVerified")
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(effectiveLimit)
      .lean();

    // If not enough results, broaden search (drop roomType constraint)
    if (rooms.length < effectiveLimit) {
      const existingIds = rooms.map((r) => r._id);
      const moreRooms = await RoomListing.find({
        ...filter,
        _id: { $ne: sourceRoom._id, $nin: existingIds },
      })
        .populate("owner", "name avatar isVerified")
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(effectiveLimit - rooms.length)
        .lean();

      rooms = [...rooms, ...moreRooms];
    }

    return rooms;
  }

  /**
   * Get search metadata — available filter options with room counts.
   * Powers the search page initial state (before user applies filters).
   * Returns: available cities, price range, room types, furnishing options.
   */
  static async getSearchMetadata() {
    const baseFilter = { status: ListingStatus.ACTIVE };

    const [
      cityStats,
      priceStats,
      roomTypeStats,
      furnishingStats,
      genderStats,
      totalActive,
    ] = await Promise.all([
      // Top cities by listing count
      RoomListing.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { _id: 0, city: "$_id", count: 1 } },
      ]),

      // Price stats
      RoomListing.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$rent" },
            maxPrice: { $max: "$rent" },
            avgPrice: { $avg: "$rent" },
            medianDeposit: { $avg: "$deposit" },
          },
        },
      ]),

      // Room type distribution
      RoomListing.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$roomType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Furnishing distribution
      RoomListing.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$furnishing", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Gender preference distribution
      RoomListing.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$genderPreference", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Total active count
      RoomListing.countDocuments(baseFilter),
    ]);

    return {
      totalActiveListings: totalActive,
      cities: cityStats,
      priceRange: priceStats[0]
        ? {
            min: Math.floor(priceStats[0].minPrice),
            max: Math.ceil(priceStats[0].maxPrice),
            avg: Math.round(priceStats[0].avgPrice),
            avgDeposit: Math.round(priceStats[0].medianDeposit || 0),
          }
        : { min: 0, max: 0, avg: 0, avgDeposit: 0 },
      roomTypes: SearchService.#formatFacets(roomTypeStats),
      furnishingOptions: SearchService.#formatFacets(furnishingStats),
      genderPreferences: SearchService.#formatFacets(genderStats),
    };
  }

  /**
   * Get featured rooms — high quality listings for homepage showcase.
   * Criteria: has images, has good description, verified owner preferred.
   */
  static async getFeaturedRooms(limit = 8) {
    const effectiveLimit = Math.min(limit, 12);

    const rooms = await RoomListing.aggregate([
      { $match: { status: ListingStatus.ACTIVE } },
      // Prioritize rooms with images and longer descriptions
      {
        $addFields: {
          qualityScore: {
            $add: [
              { $multiply: [{ $size: { $ifNull: ["$images", []] } }, 2] },
              { $divide: [{ $strLenCP: { $ifNull: ["$description", ""] } }, 100] },
              { $divide: ["$viewCount", 10] },
              "$interestCount",
            ],
          },
        },
      },
      { $sort: { qualityScore: -1, createdAt: -1 } },
      { $limit: effectiveLimit },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            { $project: { name: 1, avatar: 1, isVerified: 1 } },
          ],
        },
      },
      { $unwind: "$owner" },
      { $project: { qualityScore: 0 } },
    ]);

    return rooms;
  }
}

export default SearchService;
