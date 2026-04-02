/**
 * constants.js - Application-wide constants and enums.
 *
 * Centralizes all magic strings, enum values, and configuration
 * constants used across the backend.
 */

export const UserRoles = Object.freeze({
  OWNER: "owner",
  SEEKER: "seeker",
  BOTH: "both",
  ADMIN: "admin",
});

export const Gender = Object.freeze({
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
});

export const GenderPreference = Object.freeze({
  MALE: "male",
  FEMALE: "female",
  ANY: "any",
});

export const RoomType = Object.freeze({
  PRIVATE: "private",
  SHARED: "shared",
  ENTIRE: "entire",
});

export const FoodPreference = Object.freeze({
  VEG: "veg",
  NON_VEG: "non-veg",
  VEGAN: "vegan",
  NO_PREFERENCE: "no-preference",
});

export const SmokingDrinking = Object.freeze({
  YES: "yes",
  NO: "no",
  OCCASIONALLY: "occasionally",
});

export const SleepSchedule = Object.freeze({
  EARLY_BIRD: "early-bird",
  NIGHT_OWL: "night-owl",
  FLEXIBLE: "flexible",
});

export const MatchRequestStatus = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
});

export const MessageType = Object.freeze({
  TEXT: "text",
  IMAGE: "image",
  SYSTEM: "system",
});

export const NotificationType = Object.freeze({
  MATCH: "match",
  CHAT: "chat",
  ROOM_INTEREST: "room_interest",
  SYSTEM: "system",
});

export const ReportReason = Object.freeze({
  FAKE: "fake",
  HARASSMENT: "harassment",
  SPAM: "spam",
  OTHER: "other",
});

export const ReportStatus = Object.freeze({
  PENDING: "pending",
  REVIEWED: "reviewed",
  RESOLVED: "resolved",
});

export const LookingFor = Object.freeze({
  ROOM: "room",
  ROOMMATE: "roommate",
  BOTH: "both",
});

export const MoveInTimeline = Object.freeze({
  IMMEDIATE: "immediate",
  WITHIN_1_MONTH: "within-1-month",
  WITHIN_3_MONTHS: "within-3-months",
  FLEXIBLE: "flexible",
});

export const ListingStatus = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  RENTED: "rented",
});

// Pagination defaults
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
});
