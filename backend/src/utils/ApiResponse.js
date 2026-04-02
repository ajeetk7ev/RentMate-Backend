/**
 * ApiResponse - Standardized success response wrapper.
 *
 * Ensures every successful API response follows the same shape:
 * { statusCode, data, message, success }
 *
 * Usage:
 *   res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
 *   res.status(201).json(new ApiResponse(201, room, "Room created"));
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 200, 201)
   * @param {*} data - Response payload (object, array, null)
   * @param {string} message - Human-readable success message
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
