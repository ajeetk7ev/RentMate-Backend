/**
 * Admin Validation Schemas
 * 
 * Joi schemas for administrative management and dashboard queries.
 */
import Joi from "joi";
import { UserRoles, ListingStatus } from "../utils/constants.js";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// User filtering for admin list
export const userListQuerySchema = Joi.object({
  role: Joi.string().valid(...Object.values(UserRoles)),
  isVerified: Joi.boolean(),
  isBlocked: Joi.boolean(),
  city: Joi.string().trim(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// User moderation data
export const userModerationSchema = Joi.object({
  isVerified: Joi.boolean(),
  isBlocked: Joi.boolean(),
  role: Joi.string().valid(...Object.values(UserRoles)),
}).min(1);

// Listing filtering for admin list
export const listingListQuerySchema = Joi.object({
  status: Joi.string().valid(...Object.values(ListingStatus)),
  isFeatured: Joi.boolean(),
  city: Joi.string().trim(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// Listing moderation data
export const listingModerationSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ListingStatus)),
  isFeatured: Joi.boolean(),
}).min(1);
