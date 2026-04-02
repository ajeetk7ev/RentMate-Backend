/**
 * errorMiddleware - Global error handling middleware for Express.
 *
 * This is the LAST middleware in the chain. All errors (thrown manually
 * via ApiError or caught by asyncHandler) funnel through here.
 *
 * Handles:
 * - Custom ApiError instances
 * - Mongoose CastError (invalid ObjectId)
 * - Mongoose ValidationError (schema validation)
 * - Mongoose duplicate key error (code 11000)
 * - JWT errors (invalid/expired token)
 * - Multer file upload errors
 * - Unknown/unhandled errors (500)
 */
import env from "../config/env.js";
import logger from "../config/logger.js";

const errorMiddleware = (err, req, res, next) => {
  // Default values
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  };

  // Mongoose: Invalid ObjectId
  if (err.name === "CastError") {
    error.statusCode = 400;
    error.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: Validation Error
  if (err.name === "ValidationError") {
    error.statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = "Validation Error";
    error.errors = messages;
  }

  // Mongoose: Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    error.statusCode = 409;
    error.message = `Duplicate value for field: ${field}. Please use another value.`;
  }

  // JWT: Invalid Token
  if (err.name === "JsonWebTokenError") {
    error.statusCode = 401;
    error.message = "Invalid token. Please log in again.";
  }

  // JWT: Expired Token
  if (err.name === "TokenExpiredError") {
    error.statusCode = 401;
    error.message = "Token has expired. Please log in again.";
  }

  // Multer: File Upload Errors
  if (err.name === "MulterError") {
    error.statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      error.message = "File too large. Maximum size is 5MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      error.message = "Unexpected file field.";
    } else {
      error.message = err.message;
    }
  }

  // Joi: Validation Error
  if (err.isJoi) {
    error.statusCode = 400;
    error.message = "Validation Error";
    error.errors = err.details.map((detail) => detail.message);
  }

  // Build response
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
  };

  // Include stack trace in development only
  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  logger.error(`${error.statusCode} - ${error.message}`, { stack: err.stack });

  res.status(error.statusCode).json(response);
};

/**
 * notFoundMiddleware - Catches requests to undefined routes.
 * Must be placed AFTER all route definitions.
 */
const notFoundMiddleware = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export { errorMiddleware, notFoundMiddleware };
