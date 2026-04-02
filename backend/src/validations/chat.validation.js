/**
 * Chat Validation Schemas
 *
 * Joi schemas for chat operations.
 */
import Joi from "joi";

// Send message (REST endpoint)
export const sendMessageSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .required()
    .messages({
      "string.empty": "Message content is required",
      "string.min": "Message cannot be empty",
      "string.max": "Message cannot exceed 2000 characters",
      "any.required": "Message content is required",
    }),

  type: Joi.string()
    .valid("text", "image")
    .default("text")
    .messages({
      "any.only": "Message type must be text or image",
    }),
});

// Chat rooms list query
export const chatRoomsQuerySchema = Joi.object({
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
    .default(20)
    .messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),
});

// Message history query
export const messagesQuerySchema = Joi.object({
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
    .default(30)
    .messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),
});
