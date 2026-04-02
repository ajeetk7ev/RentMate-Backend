/**
 * Admin Routes
 *
 * Centralized portal for platform moderation and statistics.
 * All routes are strictly protected by the "admin" role.
 *
 * GET /api/v1/admin/dashboard/stats    - Dashboard metrics
 * GET /api/v1/admin/users              - User management list
 * PATCH /api/v1/admin/users/:id        - Block/Verify/Update role
 * GET /api/v1/admin/listings           - Listing moderation list
 * PATCH /api/v1/admin/listings/:id     - Feature/Update status
 * GET /api/v1/admin/reports            - [SHARED] Platform reports list
 * PATCH /api/v1/admin/reports/:id      - [SHARED] Resolve/Dismiss reports
 */
import { Router } from "express";

import AdminController from "../controllers/admin.controller.js";
import ReportController from "../controllers/report.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";

import {
  userListQuerySchema,
  userModerationSchema,
  listingListQuerySchema,
  listingModerationSchema,
} from "../validations/admin.validation.js";

import {
  reportListQuerySchema,
  updateReportStatusSchema,
} from "../validations/report.validation.js";

const router = Router();

// All routes require authentication and admin role
router.use(isAuthenticated);
router.use(authorizeRoles("admin"));

// Dashboard
router.get("/dashboard/stats", AdminController.getDashboardStats);

// User Management
router.get("/users", validateQuery(userListQuerySchema), AdminController.getAllUsers);
router.patch("/users/:id", validate(userModerationSchema), AdminController.updateUserModeration);

// Listing Management
router.get("/listings", validateQuery(listingListQuerySchema), AdminController.getAllListings);
router.patch("/listings/:id", validate(listingModerationSchema), AdminController.updateListingModeration);

// Report Management (Linked from Report Controller)
router.get("/reports", validateQuery(reportListQuerySchema), ReportController.getAllReports);
router.patch("/reports/:id", validate(updateReportStatusSchema), ReportController.updateStatus);

export default router;
