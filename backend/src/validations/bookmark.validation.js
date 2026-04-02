/**
 * Bookmark Validation Schema
 *
 * Joi schema for adding room bookmarks.
 */
import Joi from "joi";

export const createBookmarkSchema = Joi.object({
  roomId: Joi.string()
    .trim()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Room ID is required",
      "string.pattern.base": "Invalid room ID format",
      "any.required": "Room ID is required",
    }),
});
