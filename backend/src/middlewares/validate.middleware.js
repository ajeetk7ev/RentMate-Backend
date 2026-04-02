/**
 * Validation Middleware Factory
 *
 * Provides middleware for validating different parts of the request:
 * - validate(schema)       → validates req.body
 * - validateQuery(schema)  → validates req.query
 * - validateParams(schema) → validates req.params
 *
 * Usage:
 *   router.post("/signup", validate(signupSchema), controller.signup);
 *   router.get("/profiles", validateQuery(browseSchema), controller.browse);
 *   router.get("/:id", validateParams(paramSchema), controller.getById);
 */
import { formattedJoiErrors } from "../utils/formattedJoiErrors.js";

const createValidator = (source) => {
  return (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
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

      // Replace with validated + sanitized values
      req[source] = value;
      next();
    };
  };
};

export const validate = createValidator("body");
export const validateQuery = createValidator("query");
export const validateParams = createValidator("params");
