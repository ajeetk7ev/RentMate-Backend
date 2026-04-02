/**
 * Match Routes
 *
 * All routes require authentication.
 *
 * POST   /api/v1/matches/request              - Send match request
 * GET    /api/v1/matches/received              - Get received requests
 * GET    /api/v1/matches/sent                  - Get sent requests
 * GET    /api/v1/matches/connections            - Get accepted matches
 * GET    /api/v1/matches/recommended            - Get recommended roommates
 * GET    /api/v1/matches/stats                  - Get match stats
 * GET    /api/v1/matches/compatibility/:userId  - Get compatibility with a user
 * PATCH  /api/v1/matches/:id/respond            - Accept/reject request
 * DELETE /api/v1/matches/:id/cancel             - Cancel sent request
 * DELETE /api/v1/matches/:id/unmatch            - Unmatch a connection
 */
import { Router } from "express";

import MatchController from "../controllers/match.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";

import {
  sendMatchRequestSchema,
  respondMatchRequestSchema,
  matchListQuerySchema,
  recommendQuerySchema,
} from "../validations/match.validation.js";

const router = Router();

// All match routes require authentication
router.use(isAuthenticated);

// Static routes first (before :id params)
router.post("/request", validate(sendMatchRequestSchema), MatchController.sendRequest);
router.get("/received", validateQuery(matchListQuerySchema), MatchController.getReceivedRequests);
router.get("/sent", validateQuery(matchListQuerySchema), MatchController.getSentRequests);
router.get("/connections", validateQuery(matchListQuerySchema), MatchController.getMyMatches);
router.get("/recommended", validateQuery(recommendQuerySchema), MatchController.getRecommendedRoommates);
router.get("/stats", MatchController.getMatchStats);
router.get("/compatibility/:userId", MatchController.getCompatibilityWith);

// Parameterized routes
router.patch("/:id/respond", validate(respondMatchRequestSchema), MatchController.respondToRequest);
router.delete("/:id/cancel", MatchController.cancelRequest);
router.delete("/:id/unmatch", MatchController.unmatch);

export default router;
