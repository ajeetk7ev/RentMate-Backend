/**
 * Review Validation Schemas
 *
 * Joi schemas for creating and updating reviews.
 */
import Joi from "joi";

const ratingField = Joi.number()
  .integer()
  .min(1)
  .max(5)
  .messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be a whole number",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating cannot exceed 5",
  });

export const createReviewSchema = Joi.object({
  revieweeId: Joi.string()
    .trim()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Reviewee ID is required",
      "string.pattern.base": "Invalid reviewee ID format",
      "any.required": "Reviewee ID is required",
    }),

  roomId: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid room ID format",
    }),

  rating: ratingField
    .required()
    .messages({
      ...ratingField._preferences?.messages,
      "any.required": "Rating is required",
    }),

  comment: Joi.string()
    .trim()
    .max(1000)
    .messages({
      "string.max": "Comment cannot exceed 1000 characters",
    }),

  categories: Joi.object({
    cleanliness: ratingField,
    communication: ratingField,
    reliability: ratingField,
    respect: ratingField,
  }).messages({
    "object.base": "Categories must be an object",
  }),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .messages({
      "number.base": "Rating must be a number",
      "number.integer": "Rating must be a whole number",
      "number.min": "Rating must be at least 1",
      "number.max": "Rating cannot exceed 5",
    }),

  comment: Joi.string()
    .trim()
    .max(1000)
    .messages({
      "string.max": "Comment cannot exceed 1000 characters",
    }),

  categories: Joi.object({
    cleanliness: ratingField,
    communication: ratingField,
    reliability: ratingField,
    respect: ratingField,
  }).messages({
    "object.base": "Categories must be an object",
  }),
});
