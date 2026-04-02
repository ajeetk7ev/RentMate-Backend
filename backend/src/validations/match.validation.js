/**
 * Match Request Validation Schemas
 *
 * Joi schemas for sending and responding to match requests.
 */
import Joi from "joi";

export const sendMatchRequestSchema = Joi.object({
  receiverId: Joi.string()
    .trim()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Receiver ID is required",
      "string.pattern.base": "Invalid receiver ID format",
      "any.required": "Receiver ID is required",
    }),

  roomId: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid room ID format",
    }),

  message: Joi.string()
    .trim()
    .max(300)
    .messages({
      "string.max": "Message cannot exceed 300 characters",
    }),
});

export const respondMatchRequestSchema = Joi.object({
  status: Joi.string()
    .valid("accepted", "rejected")
    .required()
    .messages({
      "any.only": "Status must be accepted or rejected",
      "any.required": "Response status is required",
    }),
});
