/**
 * formattedJoiErrors - Formats Joi validation errors into per-field messages.
 *
 * Converts Joi's error.details array into a flat object where
 * each key is the field name and value is the error message.
 *
 * Input:  Joi error object
 * Output: { email: "Email is required", password: "Password must be at least 6 characters" }
 */
export const formattedJoiErrors = (error) => {
  const errors = {};
  error.details.forEach((err) => {
    const field = err.path[0];
    errors[field] = err.message;
  });

  return errors;
};
