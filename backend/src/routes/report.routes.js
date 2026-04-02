/**
 * Report Routes
 *
 * GET /api/v1/reports/me       - Get reports sent by current user
 * POST /api/v1/reports         - Create a report
 * GET /api/v1/reports          - Get all reports (Admin only)
 * PATCH /api/v1/reports/:id    - Update report status (Admin only)
 */
import { Router } from "express";

import ReportController from "../controllers/report.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";

import {
  createReportSchema,
  updateReportStatusSchema,
  reportListQuerySchema,
} from "../validations/report.validation.js";

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// User reports
router.get("/me", validateQuery(reportListQuerySchema), ReportController.getMyReports);
router.post("/", validate(createReportSchema), ReportController.createReport);

// Admin reports (require admin role)
router.use(authorizeRoles("admin"));

router.get("/", validateQuery(reportListQuerySchema), ReportController.getAllReports);
router.patch("/:id", validate(updateReportStatusSchema), ReportController.updateStatus);

export default router;
