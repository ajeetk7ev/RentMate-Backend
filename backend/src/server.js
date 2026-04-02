/**
 * Server Entry Point
 *
 * - Loads environment variables (via env.js)
 * - Connects to MongoDB
 * - Configures Cloudinary
 * - Initializes Socket.IO with Redis Pub/Sub
 * - Starts the HTTP server
 * - Handles graceful shutdown
 */
import http from "http";
import mongoose from "mongoose";
import { app } from "./app.js";
import env from "./config/env.js";
import { rabbitMQ } from "./config/rabbitmq.js";
import { startNotificationConsumer } from "./queues/notification.consumer.js";
import logger from "./config/logger.js";
import { connectDB } from "./config/db.js";
import { connectCloudinary } from "./config/cloudinary.js";
import { initializeSocket } from "./config/socket.js";

const PORT = env.PORT;

// Start Server
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Configure Cloudinary
    connectCloudinary();

    // 3. Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // 4. Initialize Socket.IO with Redis Pub/Sub adapter
    const io = initializeSocket(httpServer);

    // Make io accessible to Express routes if needed
    app.set("io", io);

    // 5. RabbitMQ Connection & Consumer
    await rabbitMQ.connect();
    await startNotificationConsumer();

    // 6. Start HTTPServer
    const server = httpServer.listen(PORT, () => {
      logger.info("RentMate API Server started");
      logger.info(`Environment : ${env.NODE_ENV}`);
      logger.info(`Port        : ${PORT}`);
      logger.info(`URL         : http://localhost:${PORT}`);
      logger.info(`Health      : http://localhost:${PORT}/api/v1/health`);
      logger.info(`WebSocket   : ws://localhost:${PORT}`);
    });

    // Graceful Shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      // Close Socket.IO connections
      io.close(() => {
        logger.info("Socket.IO connections closed.");
      });

      server.close(async () => {
        if (rabbitMQ) await rabbitMQ.close();
        logger.info("Server closed");
        mongoose.connection.close(false).then(() => {
          logger.info("MongoDB connection closed.");
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Unhandled Errors
    process.on("uncaughtException", (err) => {
      logger.error("UNCAUGHT EXCEPTION:", err);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION:", err);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
