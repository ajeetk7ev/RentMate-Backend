/**
 * Search & Discovery Validation Schemas
 *
 * Joi schemas for search queries, autocomplete, and discovery endpoints.
 */
import Joi from "joi";

// Advanced search query
export const advancedSearchSchema = Joi.object({
  q: Joi.string()
    .trim()
    .max(200)
    .messages({
      "string.max": "Search query cannot exceed 200 characters",
    }),

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

  amenities: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().trim()),
      Joi.string().trim()
    )
    .messages({
      "alternatives.types": "Amenities must be a string or array of strings",
    }),

  availableFrom: Joi.date()
    .iso()
    .messages({
      "date.base": "Available from must be a valid date",
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

  sort: Joi.string()
    .valid("relevance", "latest", "oldest", "price_low", "price_high", "popular")
    .default("relevance")
    .messages({
      "any.only": "Sort must be relevance, latest, oldest, price_low, price_high, or popular",
    }),
});

// City autocomplete query
export const citySuggestionsSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Search query is required",
      "string.min": "Search query must be at least 2 characters",
      "string.max": "Search query cannot exceed 100 characters",
      "any.required": "Search query is required",
    }),
});

// Trending / recent rooms query
export const discoveryQuerySchema = Joi.object({
  city: Joi.string()
    .trim()
    .messages({
      "string.empty": "City cannot be empty",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 20",
    }),
});

// Similar rooms query
export const similarRoomsSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(6)
    .messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 10",
    }),
});
