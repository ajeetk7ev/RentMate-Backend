/**
 * Bookmark Validation Schemas
 *
 * Joi schemas for bookmarking rooms, roommates, querying, and bulk checks.
 */
import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Bookmark a room
export const bookmarkRoomSchema = Joi.object({
  roomId: Joi.string()
    .trim()
    .required()
    .pattern(objectIdPattern)
    .messages({
      "string.empty": "Room ID is required",
      "string.pattern.base": "Invalid room ID format",
      "any.required": "Room ID is required",
    }),
});

// Bookmark a roommate
export const bookmarkRoommateSchema = Joi.object({
  roommateId: Joi.string()
    .trim()
    .required()
    .pattern(objectIdPattern)
    .messages({
      "string.empty": "Roommate ID is required",
      "string.pattern.base": "Invalid roommate ID format",
      "any.required": "Roommate ID is required",
    }),
});

// Query for listing bookmarks
export const listBookmarksQuerySchema = Joi.object({
  type: Joi.string()
    .valid("room", "roommate")
    .messages({
      "any.only": "Type must be room or roommate",
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),
});

// Check single bookmark status
export const checkBookmarkQuerySchema = Joi.object({
  targetId: Joi.string()
    .trim()
    .required()
    .pattern(objectIdPattern)
    .messages({
      "string.empty": "Target ID is required",
      "string.pattern.base": "Invalid target ID format",
      "any.required": "Target ID is required",
    }),

  type: Joi.string()
    .valid("room", "roommate")
    .required()
    .messages({
      "any.only": "Type must be room or roommate",
      "any.required": "Type is required",
    }),
});

// Bulk check bookmark status
export const bulkCheckBookmarkSchema = Joi.object({
  targetIds: Joi.array()
    .items(
      Joi.string()
        .trim()
        .pattern(objectIdPattern)
        .messages({
          "string.pattern.base": "Each target ID must be a valid ID format",
        })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      "array.min": "At least one target ID is required",
      "array.max": "Cannot check more than 50 items at once",
      "any.required": "Target IDs are required",
    }),

  type: Joi.string()
    .valid("room", "roommate")
    .required()
    .messages({
      "any.only": "Type must be room or roommate",
      "any.required": "Type is required",
    }),
});
