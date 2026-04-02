/**
 * validate - Joi validation middleware factory.
 *
 * Takes a Joi schema and returns an Express middleware that validates
 * the request body against it. On failure, returns a 400 response
 * with per-field error messages.
 *
 * Usage:
 *   import { validate } from "../middlewares/validate.middleware.js";
 *   import { signupSchema } from "../validations/auth.validation.js";
 *
 *   router.post("/signup", validate(signupSchema), authController.signup);
 */
import { formattedJoiErrors } from "../utils/formattedJoiErrors.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,       // collect all errors, not just the first
      stripUnknown: true,      // remove unknown fields from req.body
      allowUnknown: false,     // reject unknown fields
    });

    if (error) {
      const errors = formattedJoiErrors(error);

      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation Error",
        errors,
      });
    }

    next();
  };
};
