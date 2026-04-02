/**
 * Report Service
 *
 * Business logic for user and listing moderation.
 * - Create report
 * - Get my reports
 * - Get all reports (admin only)
 * - Update report status (admin only)
 */
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import RoomListing from "../models/roomListing.model.js";
import { ApiError } from "../utils/ApiError.js";
import { PAGINATION, ReportStatus, NotificationType } from "../utils/constants.js";
import logger from "../config/logger.js";
import NotificationProducer from "../queues/notification.producer.js";

class ReportService {
  /**
   * Create a new report.
   */
  static async createReport(reporterId, { reportedUserId, reportedRoomId, reason, description, evidence }) {
    // 1. Prevent self-reporting
    if (reportedUserId && reportedUserId.toString() === reporterId.toString()) {
      throw new ApiError(400, "You cannot report yourself");
    }

    // 2. Target validation
    if (reportedUserId) {
      const user = await User.findById(reportedUserId);
      if (!user) {
        throw new ApiError(404, "Reported user not found");
      }
    }

    if (reportedRoomId) {
      const room = await RoomListing.findById(reportedRoomId);
      if (!room) {
        throw new ApiError(404, "Reported room listing not found");
      }
    }

    // 3. check for existing pending report
    const existing = await Report.findOne({
      reporter: reporterId,
      reportedUser: reportedUserId || null,
      reportedRoom: reportedRoomId || null,
      status: ReportStatus.PENDING,
    });

    if (existing) {
      throw new ApiError(400, "You have already reported this target. It is being reviewed.");
    }

    // 4. save report
    const report = await Report.create({
      reporter: reporterId,
      reportedUser: reportedUserId || null,
      reportedRoom: reportedRoomId || null,
      reason,
      description,
      evidence: evidence || [],
    });

    logger.info(`Report created by ${reporterId} against ${reportedUserId || reportedRoomId}`);

    return report;
  }

  /**
   * Get reports sent by the user.
   */
  static async getMyReports(userId, queryParams = {}) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;
    const skip = (page - 1) * limit;

    const [reports, totalCount] = await Promise.all([
      Report.find({ reporter: userId })
        .populate("reportedUser", "name avatar email")
        .populate("reportedRoom", "title images status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments({ reporter: userId }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      reports,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get all reports (Admin only).
   */
  static async getAllReports(queryParams = {}) {
    const { status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = queryParams;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const [reports, totalCount] = await Promise.all([
      Report.find(filter)
        .populate("reporter", "name email")
        .populate("reportedUser", "name avatar email")
        .populate("reportedRoom", "title images status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      reports,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Update report status (Admin only).
   */
  static async updateStatus(adminId, reportId, { status, adminNotes }) {
    const report = await Report.findById(reportId);

    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    report.status = status;
    report.adminNotes = adminNotes;
    report.reviewedBy = adminId;
    
    if (status === ReportStatus.RESOLVED) {
      report.resolvedAt = new Date();
    }

    await report.save();

    logger.info(`Report ${reportId} updated to ${status} by admin ${adminId}`);

    // Trigger Notification to reporter
    NotificationProducer.publishNotification({
      recipient: report.reporter,
      type: NotificationType.SYSTEM,
      title: `Report ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your report has been ${status}. Admin Notes: ${adminNotes || "None"}`,
      refModel: "Report",
      refId: report._id,
    });

    return report;
  }
}

export default ReportService;
