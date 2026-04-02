/**
 * Report Validation Schema
 *
 * Joi schema for filing user/room reports.
 */
import Joi from "joi";

export const createReportSchema = Joi.object({
  reportedUserId: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid user ID format",
    }),

  reportedRoomId: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid room ID format",
    }),

  reason: Joi.string()
    .valid("fake", "harassment", "spam", "other")
    .required()
    .messages({
      "any.only": "Reason must be fake, harassment, spam, or other",
      "any.required": "Report reason is required",
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      "string.empty": "Description is required",
      "string.min": "Description must be at least 10 characters",
      "string.max": "Description cannot exceed 1000 characters",
      "any.required": "Description is required",
    }),
})
  .or("reportedUserId", "reportedRoomId")
  .messages({
    "object.missing": "Either reported user ID or reported room ID is required",
  });

export const updateReportStatusSchema = Joi.object({
  status: Joi.string()
    .valid("reviewed", "resolved")
    .required()
    .messages({
      "any.only": "Status must be reviewed or resolved",
      "any.required": "Status is required",
    }),

  adminNotes: Joi.string()
    .trim()
    .max(500)
    .messages({
      "string.max": "Admin notes cannot exceed 500 characters",
    }),
});
