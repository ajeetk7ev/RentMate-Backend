/**
 * Room Listing Validation Schemas
 *
 * Joi schemas for creating, updating, searching room listings,
 * and query parameter validation.
 */
import Joi from "joi";

export const createRoomSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .required()
    .messages({
      "string.empty": "Title is required",
      "string.min": "Title must be at least 5 characters",
      "string.max": "Title cannot exceed 100 characters",
      "any.required": "Title is required",
    }),

  description: Joi.string()
    .trim()
    .min(20)
    .max(2000)
    .required()
    .messages({
      "string.empty": "Description is required",
      "string.min": "Description must be at least 20 characters",
      "string.max": "Description cannot exceed 2000 characters",
      "any.required": "Description is required",
    }),

  rent: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "Rent must be a number",
      "number.positive": "Rent must be a positive amount",
      "any.required": "Rent amount is required",
    }),

  deposit: Joi.number()
    .min(0)
    .default(0)
    .messages({
      "number.base": "Deposit must be a number",
      "number.min": "Deposit cannot be negative",
    }),

  address: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Address is required",
      "any.required": "Address is required",
    }),

  city: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "City is required",
      "any.required": "City is required",
    }),

  state: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "State is required",
      "any.required": "State is required",
    }),

  pincode: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .messages({
      "string.pattern.base": "Please provide a valid 6-digit pincode",
    }),

  coordinates: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array()
      .items(Joi.number())
      .length(2)
      .messages({
        "array.length": "Coordinates must have exactly 2 values [longitude, latitude]",
      }),
  }),

  roomType: Joi.string()
    .valid("private", "shared", "entire")
    .required()
    .messages({
      "any.only": "Room type must be private, shared, or entire",
      "any.required": "Room type is required",
    }),

  totalRoommates: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(1)
    .messages({
      "number.base": "Total roommates must be a number",
      "number.integer": "Total roommates must be a whole number",
      "number.min": "Must have at least 1 roommate slot",
      "number.max": "Cannot exceed 10 roommates",
    }),

  currentOccupancy: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      "number.base": "Current occupancy must be a number",
      "number.integer": "Current occupancy must be a whole number",
      "number.min": "Current occupancy cannot be negative",
    }),

  furnishing: Joi.string()
    .valid("furnished", "semi-furnished", "unfurnished")
    .default("semi-furnished")
    .messages({
      "any.only": "Furnishing must be furnished, semi-furnished, or unfurnished",
    }),

  genderPreference: Joi.string()
    .valid("male", "female", "any")
    .default("any")
    .messages({
      "any.only": "Gender preference must be male, female, or any",
    }),

  amenities: Joi.array()
    .items(Joi.string().trim())
    .max(20)
    .messages({
      "array.max": "Cannot add more than 20 amenities",
    }),

  rules: Joi.array()
    .items(Joi.string().trim())
    .max(15)
    .messages({
      "array.max": "Cannot add more than 15 rules",
    }),

  availableFrom: Joi.date()
    .iso()
    .required()
    .messages({
      "date.base": "Available from must be a valid date",
      "date.format": "Available from must be in ISO date format",
      "any.required": "Available from date is required",
    }),
});

export const updateRoomSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .messages({
      "string.min": "Title must be at least 5 characters",
      "string.max": "Title cannot exceed 100 characters",
    }),

  description: Joi.string()
    .trim()
    .min(20)
    .max(2000)
    .messages({
      "string.min": "Description must be at least 20 characters",
      "string.max": "Description cannot exceed 2000 characters",
    }),

  rent: Joi.number()
    .positive()
    .messages({
      "number.base": "Rent must be a number",
      "number.positive": "Rent must be a positive amount",
    }),

  deposit: Joi.number()
    .min(0)
    .messages({
      "number.base": "Deposit must be a number",
      "number.min": "Deposit cannot be negative",
    }),

  address: Joi.string()
    .trim()
    .messages({
      "string.empty": "Address cannot be empty",
    }),

  city: Joi.string()
    .trim()
    .messages({
      "string.empty": "City cannot be empty",
    }),

  state: Joi.string()
    .trim()
    .messages({
      "string.empty": "State cannot be empty",
    }),

  pincode: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .messages({
      "string.pattern.base": "Please provide a valid 6-digit pincode",
    }),

  coordinates: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array()
      .items(Joi.number())
      .length(2)
      .messages({
        "array.length": "Coordinates must have exactly 2 values [longitude, latitude]",
      }),
  }),

  roomType: Joi.string()
    .valid("private", "shared", "entire")
    .messages({
      "any.only": "Room type must be private, shared, or entire",
    }),

  totalRoommates: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .messages({
      "number.base": "Total roommates must be a number",
      "number.integer": "Total roommates must be a whole number",
      "number.min": "Must have at least 1 roommate slot",
      "number.max": "Cannot exceed 10 roommates",
    }),

  currentOccupancy: Joi.number()
    .integer()
    .min(0)
    .messages({
      "number.base": "Current occupancy must be a number",
      "number.integer": "Current occupancy must be a whole number",
      "number.min": "Current occupancy cannot be negative",
    }),

  furnishing: Joi.string()
    .valid("furnished", "semi-furnished", "unfurnished")
    .messages({
      "any.only": "Furnishing must be furnished, semi-furnished, or unfurnished",
    }),

  genderPreference: Joi.string()
    .valid("male", "female", "any")
    .messages({
      "any.only": "Gender preference must be male, female, or any",
    }),

  amenities: Joi.array()
    .items(Joi.string().trim())
    .max(20)
    .messages({
      "array.max": "Cannot add more than 20 amenities",
    }),

  rules: Joi.array()
    .items(Joi.string().trim())
    .max(15)
    .messages({
      "array.max": "Cannot add more than 15 rules",
    }),

  availableFrom: Joi.date()
    .iso()
    .messages({
      "date.base": "Available from must be a valid date",
      "date.format": "Available from must be in ISO date format",
    }),
});

// Query validation for searching rooms
export const searchRoomsQuerySchema = Joi.object({
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
    .valid("latest", "oldest", "price_low", "price_high")
    .default("latest")
    .messages({
      "any.only": "Sort must be latest, oldest, price_low, or price_high",
    }),
});

// Query validation for my listings
export const myListingsQuerySchema = Joi.object({
  status: Joi.string()
    .valid("active", "inactive", "rented")
    .messages({
      "any.only": "Status must be active, inactive, or rented",
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

// Body validation for status update
export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "inactive", "rented")
    .required()
    .messages({
      "any.only": "Status must be active, inactive, or rented",
      "any.required": "Status is required",
    }),
});

// Query validation for nearby rooms
export const nearbyRoomsQuerySchema = Joi.object({
  lng: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      "number.base": "Longitude must be a number",
      "number.min": "Longitude must be between -180 and 180",
      "number.max": "Longitude must be between -180 and 180",
      "any.required": "Longitude is required",
    }),

  lat: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      "number.base": "Latitude must be a number",
      "number.min": "Latitude must be between -90 and 90",
      "number.max": "Latitude must be between -90 and 90",
      "any.required": "Latitude is required",
    }),

  radius: Joi.number()
    .min(1)
    .max(50)
    .default(5)
    .messages({
      "number.base": "Radius must be a number",
      "number.min": "Radius must be at least 1 km",
      "number.max": "Radius cannot exceed 50 km",
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
