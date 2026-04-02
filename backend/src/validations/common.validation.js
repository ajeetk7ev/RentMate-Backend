/**
 * Common Validation Helpers
 *
 * Shared Joi patterns used across multiple validation files.
 * Includes ObjectId validation and pagination query validation.
 */
import Joi from "joi";

// Reusable MongoDB ObjectId pattern
export const objectIdSchema = Joi.string()
  .trim()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    "string.pattern.base": "Invalid ID format",
  });

// Pagination query parameters
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be a whole number",
      "number.min": "Page must be at least 1",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be a whole number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),

  sort: Joi.string()
    .valid("latest", "oldest", "price_low", "price_high")
    .default("latest")
    .messages({
      "any.only": "Sort must be latest, oldest, price_low, or price_high",
    }),
});

// Room search query parameters
export const roomSearchSchema = Joi.object({
  city: Joi.string()
    .trim()
    .messages({
      "string.empty": "City cannot be empty",
    }),

  budgetMin: Joi.number()
    .min(0)
    .messages({
      "number.base": "Minimum budget must be a number",
      "number.min": "Minimum budget cannot be negative",
    }),

  budgetMax: Joi.number()
    .min(0)
    .messages({
      "number.base": "Maximum budget must be a number",
      "number.min": "Maximum budget cannot be negative",
    }),

  roomType: Joi.string()
    .valid("private", "shared", "entire")
    .messages({
      "any.only": "Room type must be private, shared, or entire",
    }),

  genderPreference: Joi.string()
    .valid("male", "female", "any")
    .messages({
      "any.only": "Gender preference must be male, female, or any",
    }),

  furnishing: Joi.string()
    .valid("furnished", "semi-furnished", "unfurnished")
    .messages({
      "any.only": "Furnishing must be furnished, semi-furnished, or unfurnished",
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be a whole number",
      "number.min": "Page must be at least 1",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be a whole number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),

  sort: Joi.string()
    .valid("latest", "oldest", "price_low", "price_high")
    .default("latest")
    .messages({
      "any.only": "Sort must be latest, oldest, price_low, or price_high",
    }),
});
