/**
 * Room Listing Service
 *
 * Contains all business logic for room listing management.
 * - Create / Update / Delete listings
 * - Upload / Delete room images
 * - Get single room (with view count)
 * - Search rooms (filters, sort, pagination)
 * - Get own listings
 * - Nearby rooms (geospatial)
 * - Update listing status
 */
import RoomListing from "../models/roomListing.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { PAGINATION, UserRoles, ListingStatus } from "../utils/constants.js";
import logger from "../config/logger.js";

const MAX_IMAGES_PER_LISTING = 10;

class RoomService {
  /**
   * Verify the user is the owner of the listing.
   * Reusable guard for update/delete operations.
   */
  static async #verifyOwnership(roomId, userId) {
    const room = await RoomListing.findById(roomId);

    if (!room) {
      throw new ApiError(404, "Room listing not found");
    }

    if (room.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to modify this listing");
    }

    return room;
  }

  /**
   * Create a new room listing.
   * Only owners or users with "both" role can create.
   */
  static async createRoom(userId, userRole, roomData) {
    // Role check
    if (userRole !== UserRoles.OWNER && userRole !== UserRoles.BOTH && userRole !== UserRoles.ADMIN) {
      throw new ApiError(403, "Only room owners can create listings. Update your role to 'owner' or 'both'");
    }

    // Validate occupancy does not exceed total roommates
    if (roomData.currentOccupancy > roomData.totalRoommates) {
      throw new ApiError(400, "Current occupancy cannot exceed total roommates");
    }

    const room = await RoomListing.create({
      ...roomData,
      owner: userId,
    });

    logger.info(`Room listing created: ${room._id} by user: ${userId}`);

    return room;
  }

  /**
   * Update a room listing.
   * Only the owner of the listing can update it.
   */
  static async updateRoom(roomId, userId, updateData) {
    const room = await RoomService.#verifyOwnership(roomId, userId);

    // Prevent updating owner and engagement metrics via this method
    const forbiddenFields = ["owner", "viewCount", "interestCount", "images"];
    forbiddenFields.forEach((field) => delete updateData[field]);

    // Validate occupancy against total roommates
    const totalRoommates = updateData.totalRoommates ?? room.totalRoommates;
    const currentOccupancy = updateData.currentOccupancy ?? room.currentOccupancy;

    if (currentOccupancy > totalRoommates) {
      throw new ApiError(400, "Current occupancy cannot exceed total roommates");
    }

    // Apply updates
    Object.assign(room, updateData);
    await room.save();

    logger.info(`Room listing updated: ${roomId}`);

    return room;
  }

  /**
   * Delete a room listing and clean up all Cloudinary images.
   */
  static async deleteRoom(roomId, userId, userRole) {
    let room;

    // Admins can delete any listing
    if (userRole === UserRoles.ADMIN) {
      room = await RoomListing.findById(roomId);
      if (!room) {
        throw new ApiError(404, "Room listing not found");
      }
    } else {
      room = await RoomService.#verifyOwnership(roomId, userId);
    }

    // Delete all images from Cloudinary
    if (room.images?.length > 0) {
      const deletePromises = room.images.map((img) =>
        deleteFromCloudinary(img.publicId).catch((err) =>
          logger.error(`Failed to delete image ${img.publicId}: ${err.message}`)
        )
      );
      await Promise.all(deletePromises);
    }

    await RoomListing.findByIdAndDelete(roomId);

    logger.info(`Room listing deleted: ${roomId}`);

    return { message: "Room listing deleted successfully" };
  }

  /**
   * Upload images for a room listing.
   * Max 10 images per listing.
   */
  static async uploadImages(roomId, userId, files) {
    const room = await RoomService.#verifyOwnership(roomId, userId);

    if (!files || files.length === 0) {
      throw new ApiError(400, "No image files provided");
    }

    const remainingSlots = MAX_IMAGES_PER_LISTING - room.images.length;

    if (remainingSlots <= 0) {
      throw new ApiError(400, `Maximum ${MAX_IMAGES_PER_LISTING} images allowed per listing`);
    }

    if (files.length > remainingSlots) {
      throw new ApiError(
        400,
        `You can only upload ${remainingSlots} more image(s). Current: ${room.images.length}/${MAX_IMAGES_PER_LISTING}`
      );
    }

    // Upload all images in parallel
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file.buffer, "rentmate/rooms")
    );

    const results = await Promise.all(uploadPromises);

    // Add uploaded images to the listing
    const newImages = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    room.images.push(...newImages);
    await room.save({ validateBeforeSave: false });

    logger.info(`${newImages.length} image(s) uploaded for room: ${roomId}`);

    return room;
  }

  /**
   * Delete a specific image from a room listing.
   */
  static async deleteImage(roomId, userId, imageId) {
    const room = await RoomService.#verifyOwnership(roomId, userId);

    const imageIndex = room.images.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      throw new ApiError(404, "Image not found in this listing");
    }

    // Delete from Cloudinary
    const image = room.images[imageIndex];
    await deleteFromCloudinary(image.publicId).catch((err) =>
      logger.error(`Failed to delete image from Cloudinary: ${err.message}`)
    );

    // Remove from array
    room.images.splice(imageIndex, 1);
    await room.save({ validateBeforeSave: false });

    logger.info(`Image deleted from room: ${roomId}, imageId: ${imageId}`);

    return room;
  }

  /**
   * Get a single room listing by ID.
   * Increments view count (skips if viewer is the owner).
   * Populates owner details.
   */
  static async getRoomById(roomId, viewerUserId = null) {
    const room = await RoomListing.findById(roomId)
      .populate("owner", "name avatar city gender age occupation isVerified createdAt");

    if (!room) {
      throw new ApiError(404, "Room listing not found");
    }

    // Increment view count only if viewer is not the owner
    if (!viewerUserId || room.owner._id.toString() !== viewerUserId.toString()) {
      await RoomListing.findByIdAndUpdate(roomId, { $inc: { viewCount: 1 } });
    }

    return room;
  }

  /**
   * Search and filter room listings with pagination.
   * Public endpoint — only shows active listings.
   */
  static async searchRooms(queryParams) {
    const {
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
      sort = "latest",
    } = queryParams;

    // Build filter query
    const filter = {
      status: ListingStatus.ACTIVE,
    };

    if (city) {
      filter.city = { $regex: new RegExp(city, "i") };
    }

    if (budgetMin !== undefined || budgetMax !== undefined) {
      filter.rent = {};
      if (budgetMin !== undefined) filter.rent.$gte = budgetMin;
      if (budgetMax !== undefined) filter.rent.$lte = budgetMax;
    }

    if (roomType) {
      filter.roomType = roomType;
    }

    if (genderPreference) {
      filter.genderPreference = genderPreference;
    }

    if (furnishing) {
      filter.furnishing = furnishing;
    }

    // Filter by amenities (room must have ALL specified amenities)
    if (amenities) {
      const amenityList = Array.isArray(amenities)
        ? amenities
        : amenities.split(",").map((a) => a.trim());

      if (amenityList.length > 0) {
        filter.amenities = { $all: amenityList };
      }
    }

    // Available from date filter
    if (availableFrom) {
      filter.availableFrom = { $lte: new Date(availableFrom) };
    }

    // Sort options
    const sortOptions = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low: { rent: 1 },
      price_high: { rent: -1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.latest;

    // Pagination
    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Execute query with count
    const [rooms, totalCount] = await Promise.all([
      RoomListing.find(filter)
        .populate("owner", "name avatar isVerified")
        .sort(sortBy)
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      RoomListing.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

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
    };
  }

  /**
   * Get all listings owned by a user.
   * Supports filtering by status.
   */
  static async getMyListings(userId, queryParams = {}) {
    const { status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;

    const filter = { owner: userId };

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const [rooms, totalCount] = await Promise.all([
      RoomListing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      RoomListing.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

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
    };
  }

  /**
   * Update listing status (active/inactive/rented).
   */
  static async updateStatus(roomId, userId, newStatus) {
    const room = await RoomService.#verifyOwnership(roomId, userId);

    // Prevent reactivating a deleted/rented listing without review
    if (room.status === ListingStatus.RENTED && newStatus === ListingStatus.ACTIVE) {
      // Reset occupancy when re-listing
      room.currentOccupancy = 0;
    }

    room.status = newStatus;
    await room.save({ validateBeforeSave: false });

    logger.info(`Room ${roomId} status updated to: ${newStatus}`);

    return room;
  }

  /**
   * Find nearby rooms using geospatial query.
   * @param {number} longitude
   * @param {number} latitude
   * @param {number} radiusKm - search radius in kilometers
   */
  static async getNearbyRooms(longitude, latitude, radiusKm = 5, queryParams = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;

    if (!longitude || !latitude) {
      throw new ApiError(400, "Longitude and latitude are required");
    }

    const radiusInMeters = radiusKm * 1000;
    const skip = (page - 1) * limit;
    const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const filter = {
      status: ListingStatus.ACTIVE,
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    };

    const [rooms, totalCount] = await Promise.all([
      RoomListing.find(filter)
        .populate("owner", "name avatar isVerified")
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      RoomListing.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / effectiveLimit);

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
    };
  }
}

export default RoomService;
