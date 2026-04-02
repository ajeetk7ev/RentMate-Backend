/**
 * Socket.IO Configuration
 *
 * Sets up Socket.IO with:
 * - JWT authentication from cookies
 * - Redis Pub/Sub adapter for horizontal scaling
 * - Connection/disconnection handling
 * - Chat event handlers
 */
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import env from "./env.js";
import logger from "./logger.js";
import { registerChatHandlers } from "../socket/chat.handler.js";

let io = null;

/**
 * Initialize Socket.IO server with the HTTP server.
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Redis Pub/Sub adapter for horizontal scaling
  try {
    const pubClient = new Redis(env.REDIS_URL);
    const subClient = pubClient.duplicate();

    pubClient.on("connect", () => logger.info("Redis Pub client connected for Socket.IO"));
    subClient.on("connect", () => logger.info("Redis Sub client connected for Socket.IO"));

    pubClient.on("error", (err) => logger.error(`Redis Pub error: ${err.message}`));
    subClient.on("error", (err) => logger.error(`Redis Sub error: ${err.message}`));

    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.IO Redis adapter configured for horizontal scaling.");
  } catch (error) {
    logger.warn(`Redis adapter setup failed: ${error.message}. Running without Redis (single-server mode).`);
  }

  // JWT Authentication middleware for Socket.IO
  io.use((socket, next) => {
    try {
      // Extract token from cookies or auth header
      let token = null;

      // Try cookies first
      if (socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      // Fallback to auth header
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded._id;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      logger.error(`Socket auth failed: ${error.message}`);
      next(new Error("Invalid or expired token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.userId} (${socket.id})`);

    // Join user's personal room (for targeted messages)
    socket.join(`user:${socket.userId}`);

    // Register chat event handlers
    registerChatHandlers(io, socket);

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.userId} (${reason})`);
    });

    // Error handling
    socket.on("error", (error) => {
      logger.error(`Socket error for ${socket.userId}: ${error.message}`);
    });
  });

  logger.info("Socket.IO initialized.");

  return io;
};

/**
 * Get the Socket.IO instance.
 * Used by services to emit events from outside socket handlers.
 */
export const getIO = () => {
  if (!io) {
    logger.warn("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
};

export default { initializeSocket, getIO };
