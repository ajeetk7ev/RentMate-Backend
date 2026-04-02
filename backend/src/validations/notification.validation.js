/**
 * Notification Validation Schemas
 * 
 * Joi schemas for notification queries.
 */
import Joi from "joi";

// Pagination for notifications list
export const notificationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});
