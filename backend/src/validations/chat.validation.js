/**
 * Chat & Message Validation Schemas
 *
 * Joi schemas for sending messages in chat rooms.
 */
import Joi from "joi";

export const sendMessageSchema = Joi.object({
  chatRoomId: Joi.string()
    .trim()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Chat room ID is required",
      "string.pattern.base": "Invalid chat room ID format",
      "any.required": "Chat room ID is required",
    }),

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
