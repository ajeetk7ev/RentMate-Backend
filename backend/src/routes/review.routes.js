/**
 * Review Routes
 *
 * GET /api/v1/reviews/user/:userId       - Get user reviews
 * GET /api/v1/reviews/user/:userId/stats - Get user rating stats
 * GET /api/v1/reviews/room/:roomId       - Get room reviews
 * POST /api/v1/reviews                   - Create review (auth required)
 * PUT /api/v1/reviews/:id                 - Update review (auth required)
 * DELETE /api/v1/reviews/:id              - Delete review (auth/admin required)
 */
import { Router } from "express";

import ReviewController from "../controllers/review.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";

import {
  createReviewSchema,
  updateReviewSchema,
  reviewListQuerySchema,
} from "../validations/review.validation.js";

const router = Router();

// Public routes for fetching reviews
router.get(
  "/user/:userId",
  validateQuery(reviewListQuerySchema),
  ReviewController.getUserReviews
);

router.get(
  "/user/:userId/stats",
  ReviewController.getUserStats
);

router.get(
  "/room/:roomId",
  validateQuery(reviewListQuerySchema),
  ReviewController.getRoomReviews
);

// Protected routes (require login)
router.use(isAuthenticated);

router.post("/", validate(createReviewSchema), ReviewController.createReview);
router.put("/:id", validate(updateReviewSchema), ReviewController.updateReview);
router.delete("/:id", ReviewController.deleteReview);

export default router;
