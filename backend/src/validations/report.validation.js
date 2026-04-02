/**
 * Report Validation Schemas
 *
 * Handles reporting of users and room listings.
 */
import Joi from "joi";
import { ReportReason, ReportStatus } from "../utils/constants.js";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Create Report Schema
export const createReportSchema = Joi.object({
  reportedUserId: Joi.string()
    .trim()
    .pattern(objectIdPattern)
    .allow(null),

  reportedRoomId: Joi.string()
    .trim()
    .pattern(objectIdPattern)
    .allow(null),

  reason: Joi.string()
    .valid(...Object.values(ReportReason))
    .required()
    .messages({
      "any.only": "Please provide a valid reason",
      "any.required": "Reason is required",
    }),

  description: Joi.string()
    .trim()
    .required()
    .max(1000)
    .messages({
      "string.max": "Description cannot exceed 1000 characters",
      "any.required": "Description is required",
    }),

  evidence: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      publicId: Joi.string().required(),
    })
  ).max(5),

}).or("reportedUserId", "reportedRoomId") // At least one of these must be provided
  .messages({
    "object.missing": "Please provide a user or a room listing to report",
  });

// Admin Review Schema
export const updateReportStatusSchema = Joi.object({
  status: Joi.string()
    .valid(ReportStatus.REVIEWED, ReportStatus.RESOLVED)
    .required()
    .messages({
      "any.only": "Target status must be reviewed or resolved",
      "any.required": "Status update is required",
    }),

  adminNotes: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .messages({
      "string.max": "Admin notes cannot exceed 500 characters",
    }),
});

// Listing Query Schema
export const reportListQuerySchema = Joi.object({
  status: Joi.string().valid(...Object.values(ReportStatus)),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
