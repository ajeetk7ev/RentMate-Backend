/**
 * Review Validation Schemas
 *
 * Joi schemas for creating and updating user and room reviews.
 */
import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Create Review Schema
export const createReviewSchema = Joi.object({
  revieweeId: Joi.string()
    .trim()
    .required()
    .pattern(objectIdPattern)
    .messages({
      "string.pattern.base": "Invalid reviewee ID format",
      "any.required": "Reviewee ID is required",
    }),

  roomId: Joi.string()
    .trim()
    .pattern(objectIdPattern)
    .allow(null)
    .messages({
      "string.pattern.base": "Invalid room ID format",
    }),

  rating: Joi.number()
    .required()
    .min(1)
    .max(5)
    .messages({
      "number.min": "Rating must be at least 1",
      "number.max": "Rating cannot exceed 5",
      "any.required": "Rating is required",
    }),

  comment: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .messages({
      "string.max": "Comment cannot exceed 1000 characters",
    }),

  categories: Joi.object({
    cleanliness: Joi.number().min(1).max(5),
    communication: Joi.number().min(1).max(5),
    reliability: Joi.number().min(1).max(5),
    respect: Joi.number().min(1).max(5),
  }),
});

// Update Review Schema
export const updateReviewSchema = Joi.object({
  rating: Joi.number()
    .min(1)
    .max(5)
    .messages({
      "number.min": "Rating must be at least 1",
      "number.max": "Rating cannot exceed 5",
    }),

  comment: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .messages({
      "string.max": "Comment cannot exceed 1000 characters",
    }),

  categories: Joi.object({
    cleanliness: Joi.number().min(1).max(5),
    communication: Joi.number().min(1).max(5),
    reliability: Joi.number().min(1).max(5),
    respect: Joi.number().min(1).max(5),
  }),
}).min(1); // At least one field must be provided for update

// Pagination Schema
export const reviewListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
