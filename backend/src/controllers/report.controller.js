/**
 * Report Controller
 *
 * Handles HTTP requests for user reports and moderation.
 */
import ReportService from "../services/report.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class ReportController {
  /**
   * POST /api/v1/reports
   * Create a new report.
   */
  static createReport = asyncHandler(async (req, res) => {
    const report = await ReportService.createReport(req.user._id, req.body);

    res
      .status(201)
      .json(new ApiResponse(201, { report }, "Report created successfully. Our team will review it."));
  });

  /**
   * GET /api/v1/reports/me
   * Get reports sent by the current user.
   */
  static getMyReports = asyncHandler(async (req, res) => {
    const result = await ReportService.getMyReports(req.user._id, req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Your reports fetched successfully"));
  });

  /**
   * GET /api/v1/reports
   * Get all reports (Admin only).
   */
  static getAllReports = asyncHandler(async (req, res) => {
    const result = await ReportService.getAllReports(req.query);

    res
      .status(200)
      .json(new ApiResponse(200, result, "All reports fetched successfully"));
  });

  /**
   * PATCH /api/v1/reports/:id
   * Update report status (Admin only).
   */
  static updateStatus = asyncHandler(async (req, res) => {
    const report = await ReportService.updateStatus(
      req.user._id,
      req.params.id,
      req.body
    );

    res
      .status(200)
      .json(new ApiResponse(200, { report }, "Report status updated successfully"));
  });
}

export default ReportController;
