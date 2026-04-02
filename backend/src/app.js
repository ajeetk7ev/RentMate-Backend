/**
 * Express Application Setup
 *
 * Configures all middleware, routes, and error handlers.
 * This file is imported by server.js which handles the
 * actual HTTP server and database connection.
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import passport from "passport";

import env from "./config/env.js";
import configurePassport from "./config/passport.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import roomRoutes from "./routes/room.routes.js";
import searchRoutes from "./routes/search.routes.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Body Parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Passport initialization (Google OAuth)
configurePassport();
app.use(passport.initialize());

// Logging
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health Check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RentMate API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/search", searchRoutes);
// app.use("/api/v1/matches", matchRoutes);
// app.use("/api/v1/chat", chatRoutes);
// app.use("/api/v1/reviews", reviewRoutes);
// app.use("/api/v1/notifications", notificationRoutes);
// app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/bookmarks", bookmarkRoutes);

// 404 Handler (must be after all routes)
app.use(notFoundMiddleware);

// Global Error Handler (must be the very last middleware)
app.use(errorMiddleware);

export { app };
