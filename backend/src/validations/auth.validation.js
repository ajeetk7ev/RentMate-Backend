/**
 * Auth Validation Schemas
 *
 * Joi schemas for signup, login, and password-related operations.
 * Supports both email and phone-based authentication.
 */
import Joi from "joi";

export const signupSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .messages({
      "string.empty": "Email cannot be empty",
      "string.email": "Please provide a valid email address",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .messages({
      "string.empty": "Phone cannot be empty",
      "string.pattern.base": "Please provide a valid 10-digit phone number",
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password cannot exceed 128 characters",
      "any.required": "Password is required",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "string.empty": "Confirm password is required",
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),

  role: Joi.string()
    .valid("owner", "seeker", "both")
    .default("seeker")
    .messages({
      "any.only": "Role must be owner, seeker, or both",
    }),
})
  .or("email", "phone")
  .messages({
    "object.missing": "Either email or phone number is required",
  });

export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .messages({
      "string.empty": "Email cannot be empty",
      "string.email": "Please provide a valid email address",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .messages({
      "string.empty": "Phone cannot be empty",
      "string.pattern.base": "Please provide a valid 10-digit phone number",
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
})
  .or("email", "phone")
  .messages({
    "object.missing": "Either email or phone number is required",
  });

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password cannot exceed 128 characters",
      "any.required": "Password is required",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "string.empty": "Confirm password is required",
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      "string.empty": "Current password is required",
      "any.required": "Current password is required",
    }),

  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      "string.empty": "New password is required",
      "string.min": "New password must be at least 6 characters",
      "string.max": "New password cannot exceed 128 characters",
      "any.required": "New password is required",
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.empty": "Confirm new password is required",
      "any.only": "New passwords do not match",
      "any.required": "Confirm new password is required",
    }),
});
