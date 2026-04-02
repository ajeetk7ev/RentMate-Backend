/**
 * User Profile Validation Schemas
 *
 * Joi schemas for profile update and lifestyle preferences.
 */
import Joi from "joi";

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .messages({
      "string.pattern.base": "Please provide a valid 10-digit phone number",
    }),

  age: Joi.number()
    .integer()
    .min(18)
    .max(100)
    .messages({
      "number.base": "Age must be a number",
      "number.integer": "Age must be a whole number",
      "number.min": "Must be at least 18 years old",
      "number.max": "Age cannot exceed 100",
    }),

  gender: Joi.string()
    .valid("male", "female", "other")
    .messages({
      "any.only": "Gender must be male, female, or other",
    }),

  occupation: Joi.string()
    .trim()
    .max(100)
    .messages({
      "string.max": "Occupation cannot exceed 100 characters",
    }),

  bio: Joi.string()
    .trim()
    .max(500)
    .messages({
      "string.max": "Bio cannot exceed 500 characters",
    }),

  city: Joi.string()
    .trim()
    .messages({
      "string.empty": "City cannot be empty",
    }),

  state: Joi.string()
    .trim()
    .messages({
      "string.empty": "State cannot be empty",
    }),

  preferredLocations: Joi.array()
    .items(Joi.string().trim())
    .max(10)
    .messages({
      "array.max": "Cannot add more than 10 preferred locations",
    }),

  budgetMin: Joi.number()
    .min(0)
    .messages({
      "number.base": "Minimum budget must be a number",
      "number.min": "Minimum budget cannot be negative",
    }),

  budgetMax: Joi.number()
    .min(0)
    .greater(Joi.ref("budgetMin"))
    .messages({
      "number.base": "Maximum budget must be a number",
      "number.min": "Maximum budget cannot be negative",
      "number.greater": "Maximum budget must be greater than minimum budget",
    }),

  lookingFor: Joi.string()
    .valid("room", "roommate", "both")
    .messages({
      "any.only": "Looking for must be room, roommate, or both",
    }),

  moveInTimeline: Joi.string()
    .valid("immediate", "within-1-month", "within-3-months", "flexible")
    .messages({
      "any.only": "Invalid move-in timeline option",
    }),

  languages: Joi.array()
    .items(Joi.string().trim())
    .max(10)
    .messages({
      "array.max": "Cannot add more than 10 languages",
    }),

  lifestyleHabits: Joi.object({
    foodPreference: Joi.string()
      .valid("veg", "non-veg", "vegan", "no-preference")
      .messages({
        "any.only": "Food preference must be veg, non-veg, vegan, or no-preference",
      }),

    smoking: Joi.string()
      .valid("yes", "no", "occasionally")
      .messages({
        "any.only": "Smoking must be yes, no, or occasionally",
      }),

    drinking: Joi.string()
      .valid("yes", "no", "occasionally")
      .messages({
        "any.only": "Drinking must be yes, no, or occasionally",
      }),

    sleepSchedule: Joi.string()
      .valid("early-bird", "night-owl", "flexible")
      .messages({
        "any.only": "Sleep schedule must be early-bird, night-owl, or flexible",
      }),
  }).messages({
    "object.base": "Lifestyle habits must be an object",
  }),
});
