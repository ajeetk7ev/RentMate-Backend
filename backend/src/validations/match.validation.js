/**
 * Match Request Validation Schemas
 *
 * Joi schemas for sending, responding, and querying match requests.
 */
import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Send a match request
export const sendMatchRequestSchema = Joi.object({
  receiverId: Joi.string()
    .trim()
    .required()
    .pattern(objectIdPattern)
    .messages({
      "string.empty": "Receiver ID is required",
      "string.pattern.base": "Invalid receiver ID format",
      "any.required": "Receiver ID is required",
    }),

  roomId: Joi.string()
    .trim()
    .pattern(objectIdPattern)
    .messages({
      "string.pattern.base": "Invalid room ID format",
    }),

  message: Joi.string()
    .trim()
    .max(300)
    .allow("")
    .messages({
      "string.max": "Message cannot exceed 300 characters",
    }),
});

// Respond to a match request (accept/reject)
export const respondMatchRequestSchema = Joi.object({
  status: Joi.string()
    .valid("accepted", "rejected")
    .required()
    .messages({
      "any.only": "Status must be accepted or rejected",
      "any.required": "Response status is required",
    }),
});

// Query for listing received/sent match requests
export const matchListQuerySchema = Joi.object({
  status: Joi.string()
    .valid("pending", "accepted", "rejected")
    .messages({
      "any.only": "Status must be pending, accepted, or rejected",
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

// Query for recommended roommates
export const recommendQuerySchema = Joi.object({
  city: Joi.string()
    .trim()
    .messages({
      "string.empty": "City cannot be empty",
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
    .max(20)
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 20",
    }),
});
