/**
 * asyncHandler - Higher-order function to wrap async route handlers.
 *
 * Eliminates the need for try-catch blocks in every controller.
 * Catches any rejected promise and forwards the error to Express's
 * next() error handler automatically.
 *
 * Usage:
 *   router.get("/rooms", asyncHandler(async (req, res) => {
 *     const rooms = await Room.find();
 *     res.status(200).json(new ApiResponse(200, rooms, "Rooms fetched"));
 *   }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
