/**
 * ApiError - Custom error class for consistent API error responses.
 *
 * Extends the native Error class to include HTTP status codes,
 * structured error data, and a success flag for the response.
 *
 * Usage:
 *   throw new ApiError(404, "Room not found");
 *   throw new ApiError(400, "Validation failed", ["email is required", "password too short"]);
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   * @param {string} message - Human-readable error message
   * @param {Array} errors - Optional array of detailed error messages/objects
   * @param {string} stack - Optional custom stack trace
   */
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
